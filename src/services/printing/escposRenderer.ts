import {ApiTaqueria, Order, OrderType} from '../../shared/types';

const LINE_WIDTH = 48;

// ESC/POS byte commands
const ESC = 0x1b;
const GS = 0x1d;
const LF = 0x0a;

const CMD = {
  init: [ESC, 0x40],
  encodingCP1252: [ESC, 0x74, 0x10],
  centerAlign: [ESC, 0x61, 0x01],
  leftAlign: [ESC, 0x61, 0x00],
  doubleHeightWidth: [GS, 0x21, 0x11],
  doubleHeight: [GS, 0x21, 0x01],
  normalSize: [GS, 0x21, 0x00],
  boldOn: [ESC, 0x45, 0x01],
  boldOff: [ESC, 0x45, 0x00],
  partialCut: [GS, 0x56, 0x41, 0x00],
};

const ORDER_TYPE_LABEL: Record<OrderType, string> = {
  DINE_IN: 'Mesa',
  TAKEAWAY: 'Para llevar',
  DELIVERY: 'Domicilio',
};

function latin1Bytes(s: string): number[] {
  const out: number[] = [];
  for (let i = 0; i < s.length; i++) {
    out.push(s.charCodeAt(i) & 0xff);
  }
  return out;
}

function sanitize(s: string): string {
  return s.replace(/[^\x20-\xff]/g, '');
}

function center(s: string, width: number): string {
  const str = s.slice(0, width);
  const pad = Math.max(0, width - str.length);
  return ' '.repeat(Math.floor(pad / 2)) + str + ' '.repeat(Math.ceil(pad / 2));
}

function padL(s: string, width: number): string {
  return s.padStart(width).slice(-width);
}

function padR(s: string, width: number): string {
  return s.padEnd(width).slice(0, width);
}

function truncate(s: string, width: number): string {
  if (s.length <= width) return s;
  return s.slice(0, width - 3) + '...';
}

function mxn(amount: number): string {
  return Number(amount).toFixed(2);
}

function wordWrap(s: string, width: number): string[] {
  const words = s.split(' ');
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    if (!current) {
      current = word;
    } else if (current.length + 1 + word.length <= width) {
      current += ' ' + word;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

export function hasCompleteUnitPrices(order: Order): boolean {
  const items =
    order.plates.length > 0
      ? order.plates.flatMap(p => p.items)
      : order.items;
  return items.length > 0 && items.every(item => item.price != null);
}

export function buildTicket(order: Order, taqueria: ApiTaqueria): Uint8Array {
  const bytes: number[] = [];
  const push = (...cmds: number[]) => bytes.push(...cmds);
  const text = (s: string) => bytes.push(...latin1Bytes(s));
  const nl = () => bytes.push(LF);

  push(...CMD.init);
  push(...CMD.encodingCP1252);

  // Taqueria name — double height+width if fits 24 chars, else double height only
  push(...CMD.centerAlign);
  const name = sanitize(taqueria.name.toUpperCase());
  const nameIsNarrow = name.length <= 24;
  push(...(nameIsNarrow ? CMD.doubleHeightWidth : CMD.doubleHeight));
  text(center(name, nameIsNarrow ? 24 : LINE_WIDTH));
  nl();
  push(...CMD.normalSize);

  // RestaurantCode · type · reference
  const refPart = order.reference
    ? ` · ${ORDER_TYPE_LABEL[order.type]} ${sanitize(order.reference)}`
    : '';
  text(center(sanitize(taqueria.restaurantCode) + refPart, LINE_WIDTH));
  nl();

  // Date/time at print moment
  const now = new Date();
  text(
    center(
      `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())} ${pad2(now.getHours())}:${pad2(now.getMinutes())}`,
      LINE_WIDTH,
    ),
  );
  nl();

  push(...CMD.leftAlign);
  text('-'.repeat(LINE_WIDTH));
  nl();

  // Column widths: CANT(4) + SP(1) + DESC(21) + UNIT(10) + AMT(12) = 48
  const QW = 4;
  const DW = 21;
  const UW = 10;
  const AW = LINE_WIDTH - QW - 1 - DW - UW; // 12

  text(padR('CANT', QW) + ' ' + padR('DESCRIPCION', DW) + padL('P.UNIT', UW) + padL('IMPORTE', AW));
  nl();

  const allItems =
    order.plates.length > 0
      ? order.plates.flatMap(p => p.items)
      : order.items;

  let total = 0;
  for (const item of allItems) {
    const unitPrice = item.price ?? 0;
    const subtotal = unitPrice * item.quantity;
    total += subtotal;
    text(
      padL(String(item.quantity), QW) +
        ' ' +
        padR(truncate(sanitize(item.name), DW), DW) +
        padL(mxn(unitPrice), UW) +
        padL('$' + mxn(subtotal), AW),
    );
    nl();
  }

  text('-'.repeat(LINE_WIDTH));
  nl();

  // Total — double height, centered
  push(...CMD.centerAlign);
  push(...CMD.doubleHeight);
  push(...CMD.boldOn);
  text(center(`TOTAL: $${mxn(total)}`, LINE_WIDTH));
  nl();
  push(...CMD.normalSize);
  push(...CMD.boldOff);
  nl();

  // Footer
  text(center('Gracias por su compra', LINE_WIDTH));
  nl();
  const footerBody =
    'Estamos encantados de atenderte, vuelve cuando quieras y disfruta de nuestros ricos tacos';
  for (const line of wordWrap(footerBody, LINE_WIDTH)) {
    text(center(line, LINE_WIDTH));
    nl();
  }
  nl();

  push(...CMD.partialCut);

  return new Uint8Array(bytes);
}
