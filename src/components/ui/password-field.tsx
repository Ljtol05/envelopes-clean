import React from 'react'; void React;
import { Input } from './input';
import { Label } from './label';

interface PasswordFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label: string;
  errorId?: string;
  errorMessage?: string;
  containerClassName?: string;
}

export function PasswordField({ id, label, errorId, errorMessage, containerClassName, ...rest }: PasswordFieldProps) {
  const [show, setShow] = React.useState(false);
  return (
    <div className={containerClassName || ''}>
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input id={id} type={show ? 'text' : 'password'} aria-invalid={errorMessage ? 'true' : undefined} aria-describedby={errorMessage ? errorId : undefined} {...rest} />
        <button type="button" onClick={()=>setShow(s=>!s)} className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-[color:var(--owl-accent)] hover:underline select-none" aria-label={show? 'Hide password':'Show password'}>{show? 'Hide':'Show'}</button>
      </div>
      {errorMessage && <p id={errorId} className="text-xs text-[color:var(--owl-accent)]">{errorMessage}</p>}
    </div>
  );
}
