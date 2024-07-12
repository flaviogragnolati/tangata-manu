import { type ZodSchema } from 'zod';
import { DevTool } from '@hookform/devtools';
import {
  type FormHTMLAttributes,
  type FormEventHandler,
  type PropsWithChildren,
} from 'react';
import {
  useForm,
  FormProvider as ReactHookFormProvider,
  type FieldValues,
  type FormProviderProps,
  type UseFormProps,
  type SubmitHandler,
  type UseFormReturn,
  type SubmitErrorHandler,
} from 'react-hook-form';

import { env } from '~/env';
import { zodResolver } from '@hookform/resolvers/zod';

export type FormContainerProps<T extends FieldValues = FieldValues> =
  PropsWithChildren<
    UseFormProps<T> & {
      onSuccess?: SubmitHandler<T>;
      onError?: SubmitErrorHandler<T>;
      handleSubmit?: FormEventHandler<HTMLFormElement>;
      formContext?: UseFormReturn<T>;
      schema?: ZodSchema;
      FormProps?: FormHTMLAttributes<HTMLFormElement>;
    }
  >;

export default function FormContainer<
  TFieldValues extends FieldValues = FieldValues,
>({
  children,
  handleSubmit,
  formContext,
  onSuccess,
  onError,
  FormProps,
  schema,
  ...useFormProps
}: PropsWithChildren<FormContainerProps<TFieldValues>>) {
  const isDev = env.NEXT_PUBLIC_ENV === 'development';

  if (!formContext) {
    return (
      <FormProviderWithoutContext<TFieldValues>
        {...{
          onSuccess,
          onError,
          FormProps,
          children,
          schema,
          ...useFormProps,
        }}
      />
    );
  }

  if (typeof onSuccess === 'function' && typeof handleSubmit === 'function') {
    console.warn(
      'Property `onSuccess` will be ignored because handleSubmit is provided',
    );
  }

  return (
    <ReactHookFormProvider {...formContext}>
      <form
        noValidate
        {...FormProps}
        onSubmit={
          handleSubmit
            ? handleSubmit
            : onSuccess
              ? formContext.handleSubmit(onSuccess, onError)
              : () => console.log('submit handler `onSuccess` is missing')
        }
      >
        {children}
      </form>
      {isDev && <DevTool {...formContext} />}
    </ReactHookFormProvider>
  );
}
function FormProviderWithoutContext<
  TFieldValues extends FieldValues = FieldValues,
>({
  children,
  onSuccess,
  onError,
  FormProps,
  schema,
  ...useFormProps
}: PropsWithChildren<FormContainerProps<TFieldValues>>) {
  const isDev = env.NEXT_PUBLIC_ENV === 'development';

  const methods = useForm<TFieldValues>({
    ...useFormProps,
    resolver: schema ? zodResolver(schema) : undefined,
  });
  const { handleSubmit } = methods;

  return (
    <ReactHookFormProvider {...methods}>
      <form
        onSubmit={handleSubmit(
          onSuccess
            ? onSuccess
            : () => console.log('submit handler `onSuccess` is missing'),
          onError,
        )}
        noValidate
        {...FormProps}
      >
        {children}
      </form>
      {isDev && <DevTool {...methods} />}
    </ReactHookFormProvider>
  );
}
