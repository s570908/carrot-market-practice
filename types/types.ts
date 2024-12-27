// export enum Status {
//     Reserved = 'reserved',
//     Sold = 'sold',
//     Selling = 'selling'
//   }

import { Server as NetServer, Socket } from "net";
import { NextApiResponse } from "next";
import { Server as SocketIOServer } from "socket.io";
//import { Server, Member, Profile } from "@prisma/client"

// export type ServerWithMembersWithProfiles = Server & {
//   members: (Member & { profile: Profile })[];
// };

export type NextApiResponseServerIo = NextApiResponse & {
  socket: Socket & {
    server: NetServer & {
      io: SocketIOServer;
    };
  };
};

export enum FilterType {
  CreatedBy = "CreatedBy",
  CreatedFor = "CreatedFor",
  All = "All",
}

export interface MessageData {
  id: number; // sellerChat.id는 Prisma에서 Int이므로 number로 설정
  chatMsg: string; // sellerChat.chatMsg는 String이므로 string으로 설정
  user: {
    id: number | undefined; // user?.id는 undefined일 수 있음
  };
  createdAt: Date; // sellerChat.createdAt은 DateTime이므로 Date로 설정
  channelId: number; // chatRoomId는 Prisma에서 Int이므로 number로 설정
  //isNew?: boolean; // isNew는 선택적으로 존재하며 boolean 또는 undefined일 수 있음
}
