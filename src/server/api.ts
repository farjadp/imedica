import "server-only";
import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { Prisma } from "@/generated/prisma/client";
import { fieldErrors } from "@/lib/form";

import { HttpError } from "./auth/guards";
import { env } from "./env";
import { isSameOrigin } from "./origin";

type Ctx<P> = { params: Promise<P> };

/**
 * Wraps a route handler: JSON in, JSON out, and every failure mapped to a
 * status code with a message a person can act on. Unknown errors are logged
 * and returned as a generic 500, never with internals.
 */
export function route<P = Record<string, string>>(
  fn: (req: Request, params: P) => Promise<unknown>,
): (req: Request, ctx: Ctx<P>) => Promise<NextResponse> {
  return async (req, ctx) => {
    try {
      assertSameOrigin(req);
      const data = await fn(req, await ctx.params);
      if (data instanceof NextResponse) return data;
      return NextResponse.json({ data }, { status: req.method === "POST" ? 201 : 200 });
    } catch (error) {
      return toErrorResponse(error);
    }
  };
}

/**
 * Browsers send Origin on cross-site writes. A cookie-authenticated write from
 * another site is refused; the mobile app (bearer token, no Origin) passes.
 */
function assertSameOrigin(req: Request) {
  if (!isSameOrigin(req, [new URL(env().APP_URL).host])) throw new HttpError(403, "Cross-site requests aren't allowed.");
}

export function toErrorResponse(error: unknown): NextResponse {
  if (error instanceof HttpError) {
    return NextResponse.json({ error: { message: error.message } }, { status: error.status });
  }
  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: { message: "Some fields need attention.", fields: fieldErrors(error) } },
      { status: 422 },
    );
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2025") return NextResponse.json({ error: { message: "Not found." } }, { status: 404 });
    if (error.code === "P2002") {
      return NextResponse.json({ error: { message: "That already exists." } }, { status: 409 });
    }
  }
  console.error("[api] unhandled", error);
  return NextResponse.json({ error: { message: "Something went wrong on our side." } }, { status: 500 });
}

export async function readJson(req: Request): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    throw new HttpError(400, "The request body isn't valid JSON.");
  }
}
