import { initTRPC } from '@trpc/server';
import { z } from 'zod';

// to test
interface User {
  id: string;
  name: string;
}

const userList: User[] = [
  {
    id: '1',
    name: 'EMIL',
  },
];

export const t = initTRPC.create();

export const appRouter = t.router({
  userById: t.procedure.query((req) => {
    return userList[0];
  }),
});
// export type definition of API
export type AppRouter = typeof appRouter;
