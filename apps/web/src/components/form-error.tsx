export default function FormError({ message }: { message: string | null }) {
  return message ? (
    <p className="mt-3 text-destructive text-sm" role="alert">
      {message}
    </p>
  ) : null;
}
