export default function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="mt-1.5 text-sm text-error-500" role="alert">
      {message}
    </p>
  );
}