import { TextField, type TextFieldProps } from '@mui/material';
import { type RefAttributes, type ChangeEvent, type ReactNode } from 'react';
import {
  useController,
  type Control,
  type FieldPath,
  type PathValue,
  type FieldError,
  type FieldValues,
  type UseFormReturn,
  type UseControllerProps,
} from 'react-hook-form';

export type TextFieldElementProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
  TValue = unknown,
> = Omit<TextFieldProps, 'name'> & {
  name: TName;
  control?: Control<TFieldValues>;
  rules?: UseControllerProps<TFieldValues, TName>['rules'];
};

// type TextFieldElementComponent = <
//   TFieldValues extends FieldValues = FieldValues,
//   TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
//   TValue = unknown,
// >(
//   props: TextFieldElementProps<TFieldValues, TName, TValue>,
// ) => JSX.Element;

function TextFieldElement<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
  TValue = unknown,
>(props: TextFieldElementProps<TFieldValues, TName, TValue>) {
  const { name, control, rules: _rules, required, ...rest } = props;

  const rules = _rules ?? {
    required: required ?? false,
  };
  const { field } = useController({
    name,
    control,
    rules,
    disabled: rest.disabled,
  });

  return <TextField {...field} {...rest} />;
}

TextFieldElement.displayName = 'TextFieldElement';
export default TextFieldElement;
