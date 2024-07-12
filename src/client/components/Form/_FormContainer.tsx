import { DevTool } from '@hookform/devtools';
import { type PropsWithChildren } from 'react';
import {
  FormContainer as RHFMFormContainer,
  type FormContainerProps,
} from 'react-hook-form-mui';

import { env } from '~/env';

const ENV = env.NEXT_PUBLIC_ENV;

type Props = PropsWithChildren<FormContainerProps>;

export default function FormContainer({ children, ...props }: Props) {
  const methods = props.formContext;
  return (
    <RHFMFormContainer {...props}>
      {children} {ENV === 'development' && <DevTool {...methods} />}
    </RHFMFormContainer>
  );
}
