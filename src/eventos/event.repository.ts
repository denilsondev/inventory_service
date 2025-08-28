import { Injectable } from "@nestjs/common";
import { PrismaClient, EventoProcessado } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class EventRepository {
    constructor(private readonly prisma: PrismaService) {}

    async findByEventId(idEvento: string, idLoja: string): Promise<EventoProcessado | null> {
        return this.prisma.eventoProcessado.findUnique({
            where: { idEvento_idLoja: { idEvento, idLoja } }
        });
    }

    async createEvent(idEvento:string, idLoja:string): Promise<EventoProcessado> {
        return this.prisma.eventoProcessado.create({
            data: {
                idEvento,
                idLoja
            }
        })
    }
}