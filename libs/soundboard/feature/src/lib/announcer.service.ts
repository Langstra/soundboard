import { Service } from '@angular/core';

@Service()
export class AnnouncerService {
  speak(text: string): Promise<void> {
    return new Promise((resolve) => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'nl-NL';
      utterance.voice = speechSynthesis.getVoices().find((voice) => voice.lang.startsWith('nl')) ?? null;
      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();
      speechSynthesis.speak(utterance);
    });
  }

  cancel(): void {
    speechSynthesis.cancel();
  }
}
