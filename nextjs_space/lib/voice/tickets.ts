
// Voice Ticket Management
// Creates and manages fallback tickets when AI cannot handle the call

import { prisma } from '@/lib/db';
import { VoiceTicketStatus, TicketPriority } from '@prisma/client';
import { sendEmail } from '@/lib/email';

export interface CreateTicketRequest {
  clinicId: string;
  customerPhone: string;
  customerName?: string;
  customerId?: string;
  callId?: string;
  subject: string;
  description: string;
  transcript?: string;
  priority?: TicketPriority;
}

/**
 * Generate unique ticket number
 */
async function generateTicketNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.voiceTicket.count({
    where: {
      ticketNumber: {
        startsWith: `TICKET-${year}-`,
      },
    },
  });
  
  const ticketNum = (count + 1).toString().padStart(4, '0');
  return `TICKET-${year}-${ticketNum}`;
}

/**
 * Create a fallback ticket when AI cannot handle the call
 */
export async function createVoiceTicket(request: CreateTicketRequest): Promise<string> {
  try {
    const ticketNumber = await generateTicketNumber();

    const ticket = await prisma.voiceTicket.create({
      data: {
        clinicId: request.clinicId,
        ticketNumber,
        customerPhone: request.customerPhone,
        customerName: request.customerName,
        customerId: request.customerId,
        callId: request.callId,
        subject: request.subject,
        description: request.description,
        transcript: request.transcript,
        status: VoiceTicketStatus.OPEN,
        priority: request.priority || TicketPriority.HIGH,
      },
    });

    // Send email notification
    await sendTicketEmail(ticket.id);

    return ticket.id;
  } catch (error) {
    console.error('Failed to create voice ticket:', error);
    throw new Error('Failed to create voice ticket');
  }
}

/**
 * Send email notification for a new ticket
 */
export async function sendTicketEmail(ticketId: string): Promise<void> {
  try {
    const ticket = await prisma.voiceTicket.findUnique({
      where: { id: ticketId },
      include: {
        clinic: true,
        customer: true,
      },
    });

    if (!ticket) {
      throw new Error('Ticket not found');
    }

    // Get voice configuration for fallback email
    const voiceConfig = await prisma.voiceConfiguration.findUnique({
      where: { clinicId: ticket.clinicId },
    });

    const fallbackEmail = voiceConfig?.fallbackEmail || 'info@archacademy.se';
    const fallbackSubject = voiceConfig?.fallbackSubject || 'Tappat kundsamtal';

    const emailBody = `
      <h2>Nytt kundsamtal som kräver uppföljning</h2>
      
      <p><strong>Ticket-nummer:</strong> ${ticket.ticketNumber}</p>
      <p><strong>Prioritet:</strong> ${ticket.priority}</p>
      <p><strong>Klinik:</strong> ${ticket.clinic.name}</p>
      
      <h3>Kunduppgifter</h3>
      <p><strong>Telefon:</strong> ${ticket.customerPhone}</p>
      ${ticket.customerName ? `<p><strong>Namn:</strong> ${ticket.customerName}</p>` : ''}
      
      <h3>Ärende</h3>
      <p><strong>Ämne:</strong> ${ticket.subject}</p>
      <p><strong>Beskrivning:</strong> ${ticket.description}</p>
      
      ${ticket.transcript ? `
        <h3>Samtalsutskrift</h3>
        <pre style="background: #f5f5f5; padding: 10px; border-radius: 4px; white-space: pre-wrap;">
${ticket.transcript}
        </pre>
      ` : ''}
      
      <hr style="margin: 20px 0;" />
      
      <p><strong>Åtgärd:</strong> Ring upp kunden på ${ticket.customerPhone} för att slutföra ärendet.</p>
      
      <p style="color: #666; font-size: 12px;">
        Detta ärende genererades automatiskt av Flow Voice Assistant när AI inte kunde hantera samtalet.
      </p>
    `;

    await sendEmail({
      to: fallbackEmail,
      subject: `${fallbackSubject} - ${ticket.ticketNumber}`,
      html: emailBody,
    });

    // Update ticket to mark email as sent
    await prisma.voiceTicket.update({
      where: { id: ticketId },
      data: {
        emailSent: true,
        emailSentAt: new Date(),
        emailTo: fallbackEmail,
      },
    });
  } catch (error) {
    console.error('Failed to send ticket email:', error);
    // Don't throw - ticket is already created, email is just a notification
  }
}

/**
 * Resolve a voice ticket
 */
export async function resolveVoiceTicket(
  ticketId: string,
  resolvedBy: string,
  resolution: string
): Promise<void> {
  await prisma.voiceTicket.update({
    where: { id: ticketId },
    data: {
      resolved: true,
      resolvedAt: new Date(),
      resolvedBy,
      resolution,
      status: VoiceTicketStatus.RESOLVED,
    },
  });
}
