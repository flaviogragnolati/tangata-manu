import { ChangeEvent, forwardRef, ReactNode, Ref, RefAttributes } from 'react';
import { MenuItem, TextField, TextFieldProps, useForkRef } from '@mui/material';
import {
  type Control,
  type FieldError,
  type FieldPath,
  type FieldValues,
  type PathValue,
  useController,
  type UseControllerProps,
} from 'react-hook-form';

export type SelectElementProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
  TValue = unknown,
> = Omit<TextFieldProps, 'name' | 'type'> & {
  name: TName;
  control?: Control<TFieldValues>;
  rules?: UseControllerProps<TFieldValues, TName>['rules'];
  options?: TValue[];
  valueKey?: string;
  labelKey?: string;
  type?: 'string' | 'number';
};

// type SelectElementComponent = <
//   TFieldValues extends FieldValues = FieldValues,
//   TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
//   TValue = unknown,
// >(
//   props: SelectElementProps<TFieldValues, TName, TValue> &
//     RefAttributes<HTMLDivElement>,
// ) => JSX.Element;

function SelectElement<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
  TValue = unknown,
>(props: SelectElementProps<TFieldValues, TName, TValue>) {
  const {
    name,
    control,
    rules: _rules,
    type,
    required,
    valueKey = 'id',
    labelKey = 'label',
    options = [],
    ...rest
  } = props;

  const isNativeSelect = !!rest.SelectProps?.native;

  const rules = _rules ?? {
    required: required ?? false,
  };

  const {
    field,
    fieldState: { error },
  } = useController({
    name,
    control,
    rules,
    disabled: rest.disabled,
  });

  // handle shrink on number input fields
  //   if (type === 'number' && typeof value !== 'undefined') {
  //     rest.InputLabelProps = rest.InputLabelProps || {};
  //     rest.InputLabelProps.shrink = true;
  //   }

  return (
    <TextField
      {...rest}
      name={name}
      onBlur={field.onBlur}
      select
      required={required}
      error={!!error}
      helperText={error ? error.message : rest.helperText}
    >
      {isNativeSelect && <option />}
      {options.map((item, idx) => {
        // Need to clearly apply key because of https://github.com/vercel/next.js/issues/55642
        const key = `${name}_${idx}`;
        // const optionProps = {
        //   value: item?.[valueKey] ?? item,
        //   disabled: propertyExists(item, 'disabled') ? !!item.disabled : false,
        //   children: item[labelKey],
        // };
        return isNativeSelect ? <option key={key} /> : <MenuItem key={key} />;
      })}
    </TextField>
  );
}

SelectElement.displayName = 'SelectElement';
export default SelectElement;
