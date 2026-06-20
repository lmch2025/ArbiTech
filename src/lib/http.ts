import { NextResponse } from "next/server";

export function ok(data: unknown, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function created(data: unknown) {
  return NextResponse.json(data, { status: 201 });
}

export function bad(message: string, details?: unknown) {
  return NextResponse.json({ error: message, details }, { status: 400 });
}

export function unauthorized(message = "Vous devez être connecté.") {
  return NextResponse.json({ error: message }, { status: 401 });
}

export function forbidden(message = "Vous n'avez pas accès à cette resource.") {
  return NextResponse.json({ error: message }, { status: 403 });
}

export function notFound(message = "Introuvable.") {
  return NextResponse.json({ error: message }, { status: 404 });
}

export function serverError(message = "Erreur serveur.", details?: unknown) {
  console.error("[serverError]", message, details);
  return NextResponse.json({ error: message }, { status: 500 });
}

export function handleErr(e: unknown) {
  const err = e as { message?: string };
  if (err?.message === "UNAUTHORIZED") return unauthorized();
  if (err?.message === "FORBIDDEN") return forbidden();
  return serverError(err?.message || "Une erreur est survenue.", e);
}
