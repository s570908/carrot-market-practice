// export enum Status {
//     Reserved = 'reserved',
//     Sold = 'sold',
//     Selling = 'selling'
//   }

import { Fav } from "@prisma/client";
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

// Define types for the nested objects
interface RecentMessage {
  chatMsg: string;
  isNew: boolean;
  userId: number;
  createdAt: string;
  updatedAt: string;
}

interface User {
  name: string;
  avatar: string | null;
  id: number;
}

interface Product {
  id: number;
  userId: number;
  name: string;
  image: string | null;
  price: number;
  status: string;
}

interface SellerChat {
  chatMsg: string;
  isNew: boolean;
  user: User;
}

export interface ChatRoomWithUnreadCount {
  id: number;
  productId: number;
  buyerId: number;
  sellerId: number;
  recentMsg: RecentMessage | null;
  buyer: User;
  seller: User;
  product: Product;
  sellerChat: SellerChat[];
  unreadCount: number; // Added from `userUnreadCounts`
}

export interface ChatRoomResponse {
  ok: boolean;
  chatRoomListWithUnreadCount: ChatRoomWithUnreadCount[];
}
