import { Reservation } from "@prisma/client";

export interface ReserveResponse {
    ok: boolean;
    isReserved: boolean;
    reserve: Reservation;
  }