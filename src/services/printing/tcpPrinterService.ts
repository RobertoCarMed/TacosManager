import TcpSocket from 'react-native-tcp-socket';

const CONNECT_TIMEOUT_MS = 5000;

export function sendRawBytes(host: string, port: number, data: Uint8Array): Promise<void> {
  return new Promise((resolve, reject) => {
    let done = false;

    const settle = (err?: Error) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      if (err) reject(err);
      else resolve();
    };

    const timer = setTimeout(() => {
      client.destroy();
      settle(
        new Error(
          `Sin respuesta de ${host}:${port}. Verifica que la impresora esté encendida y conectada a la red.`,
        ),
      );
    }, CONNECT_TIMEOUT_MS);

    const client = TcpSocket.createConnection({host, port}, () => {
      clearTimeout(timer);
      try {
        client.write(data);
        client.end();
      } catch (e) {
        client.destroy();
        settle(e instanceof Error ? e : new Error(String(e)));
      }
    });

    client.on('close', () => settle());
    client.on('error', (err: Error) => {
      client.destroy();
      settle(err);
    });
  });
}
