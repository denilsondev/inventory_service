import { Injectable } from "@nestjs/common";
import { PrismaClient, EventoProcessado } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class EventRepository {
    constructor(private readonly prisma: PrismaService) {}

    async findByEventId(idEvento: string): Promise<EventoProcessado | null> {
        return this.prisma.eventoProcessado.findUnique({
            where: { idEvento }
        });
    }

    async createEvent(idEvento:string): Promise<EventoProcessado> {
        return this.prisma.eventoProcessado.create({
            data: {idEvento}
        })
    }
}