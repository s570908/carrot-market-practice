// import { PrismaClient } from "prisma/prisma-client";

// const client = new PrismaClient();

// // ref: https://planetscale.com/blog/how-to-seed-a-database-with-prisma-and-next-js
// // fake(test) data
// async function main() {
//   new Array(200).fill(0).forEach(async (_, idx) => {
//     await client.stream.create({
//       data: {
//         name: String(idx),
//         description: String(idx),
//         price: idx,
//         user: {
//           connect: {
//             id: 10,
//           },
//         },
//       },
//     });
//     console.log(`${idx}/200`);
//   });
// }

// main()
//   .catch((e) => console.log(e))
//   .finally(() => client.$disconnect());
