import { Provider } from '@angular/core';

import { Id } from '../app/core/models';
import {
  PLAYER_CHANNEL_FACTORY,
  PlayerChannel,
  PlayerMessage,
  playerChannelName,
} from '../app/features/presentation/player-screen/player-channel';

/** Canal en mémoire : comme `BroadcastChannel`, un message va aux autres canaux du même nom. */
class FakeChannel implements PlayerChannel {
  onmessage: ((event: MessageEvent<PlayerMessage>) => void) | null = null;
  closed = false;

  constructor(
    readonly name: string,
    private readonly bus: FakePlayerBus,
  ) {}

  postMessage(message: PlayerMessage): void {
    if (this.closed) {
      return;
    }
    this.bus.sent.push({ from: this, message });
    for (const other of this.bus.channels) {
      if (other !== this && other.name === this.name && !other.closed) {
        queueMicrotask(() => other.onmessage?.({ data: message } as MessageEvent<PlayerMessage>));
      }
    }
  }

  close(): void {
    this.closed = true;
  }
}

export interface FakePlayerBus {
  channels: FakeChannel[];
  sent: { from: PlayerChannel; message: PlayerMessage }[];
  /** Un canal « de l'autre fenêtre », pour écouter ou envoyer comme elle. */
  open(projectId: Id): PlayerChannel;
  /** Messages reçus par un canal ouvert avec `open()`. */
  received(channel: PlayerChannel): PlayerMessage[];
  providers: Provider[];
}

/** Remplace `BroadcastChannel` par un bus en mémoire (jsdom n'en a pas de fiable). */
export function useFakePlayerChannel(): FakePlayerBus {
  const inbox = new Map<PlayerChannel, PlayerMessage[]>();
  const bus: FakePlayerBus = {
    channels: [],
    sent: [],
    open: (projectId) => {
      const channel = create(projectId);
      inbox.set(channel, []);
      channel.onmessage = (event) => inbox.get(channel)!.push(event.data);
      return channel;
    },
    received: (channel) => inbox.get(channel) ?? [],
    providers: [],
  };
  const create = (projectId: Id) => {
    const channel = new FakeChannel(playerChannelName(projectId), bus);
    bus.channels.push(channel);
    return channel;
  };
  beforeEach(() => {
    bus.channels.length = 0;
    bus.sent.length = 0;
    inbox.clear();
  });
  bus.providers.push({ provide: PLAYER_CHANNEL_FACTORY, useValue: create });
  return bus;
}
