import { Injectable } from "@nestjs/common";
import { PrismaClient, SeenEvent } from "@prisma/client";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class EventRepository {
    constructor(private readonly prisma: PrismaService) {}

    async findByEventId(eventId: string): Promise<SeenEvent | null> {
        return this.prisma.seenEvent.findUnique({
            where: { eventId }
        });
    }

    async createEvent(eventId:string): Promise<SeenEvent> {
        return this.prisma.seenEvent.create({
            data: {eventId}
        })
    }

     async markEventAsProcessedInTransaction(tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>, eventId: string): Promise<SeenEvent> {
    return tx.seenEvent.create({
      data: { eventId }
    });
  }

    
}