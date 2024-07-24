'use client';

import type { User } from '@prisma/client';
import {
  Typography,
  Avatar,
  Card,
  CardContent,
  CardHeader,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';

import { ARSformatter } from '~/utils/helpers';

type Props = {
  user: User;
  salary: { siteName: string; totalHours: number; totalAmount: number }[];
  extraSalary?: number;
};
export default function UserSalaryCard({ user, salary, extraSalary }: Props) {
  if (!salary || salary.length === 0) {
    return null;
  }
  return (
    <Card sx={{ maxWidth: 500 }} className="m-2 bg-slate-50" elevation={3}>
      <CardHeader
        avatar={
          user.image ? (
            <Avatar src={user.image} />
          ) : (
            <Avatar>{user.name}</Avatar>
          )
        }
        title={user.name}
        subheader={user.email}
      />
      <CardContent>
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell align="center">
                  <strong>Sitio</strong>
                </TableCell>
                <TableCell align="center">
                  <strong>Horas</strong>
                </TableCell>
                <TableCell align="center">
                  <strong>Monto</strong>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {salary.map((row, idx) => {
                const isEven = idx % 2 === 0;
                return (
                  <TableRow
                    key={row.siteName}
                    sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                    style={{ backgroundColor: isEven ? '#f9f9f9' : 'white' }}
                  >
                    <TableCell align="center">{row.siteName}</TableCell>
                    <TableCell align="center">{row.totalHours}</TableCell>
                    <TableCell align="center">{row.totalAmount}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
        <Stack spacing={1} direction="column" className="mt-2" alignItems="end">
          <Typography variant="body2" color="text.secondary">
            Total de horas:{' '}
            <strong>
              {salary.reduce((acc, curr) => acc + curr.totalHours, 0)}
            </strong>
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Total de monto:{' '}
            <strong>
              {ARSformatter.format(
                salary.reduce((acc, curr) => acc + curr.totalAmount, 0),
              )}
            </strong>
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Aguinaldo acumulado:{' '}
            <strong>{ARSformatter.format(extraSalary ?? 0)}</strong>
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  );
}