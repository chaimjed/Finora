import { Alert } from "flowbite-react";
import { HiCheckCircle, HiXCircle } from "react-icons/hi";
import { PASSWORD_RULES, isPasswordValid } from "../lib/passwordRules";
import { cn } from "../utils";

interface Props {
  password: string;
  compact?: boolean; 
  className?: string;
}

export default function PasswordRequirements({ password, compact, className }: Props) {
  const allMet = isPasswordValid(password);

  return (
    <Alert color={allMet ? "success" : "gray"} className={cn("mt-2", compact && "p-3", className)}>
      {!compact && (
        <p className="mb-1.5 text-sm font-medium">
          {allMet ? "Your password is strong enough" : "Your password must contain:"}
        </p>
      )}
      <ul className={cn(compact ? "grid grid-cols-1 gap-x-4 gap-y-1 sm:grid-cols-2" : "space-y-1")}>
        {PASSWORD_RULES.map((rule) => {
          const ok = rule.test(password);
          return (
            <li key={rule.id} className="flex items-center gap-2 text-sm">
              {ok ? (
                <HiCheckCircle className="size-4 shrink-0 text-success-500" />
              ) : (
                <HiXCircle className="size-4 shrink-0 text-error-500" />
              )}
              <span>{rule.label}</span>
            </li>
          );
        })}
      </ul>
    </Alert>
  );
}