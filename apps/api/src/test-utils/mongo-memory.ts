import { MongoMemoryServer } from 'mongodb-memory-server';

let memoryServer: MongoMemoryServer | undefined;

export async function startMongoMemory(): Promise<string> {
  memoryServer = await MongoMemoryServer.create();
  return memoryServer.getUri();
}

export async function stopMongoMemory(): Promise<void> {
  await memoryServer?.stop();
  memoryServer = undefined;
}
