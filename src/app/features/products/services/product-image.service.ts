import { Injectable } from '@angular/core';

export type ImageValidationResult = { valid: true } | { valid: false; message: string };

@Injectable({ providedIn: 'root' })
export class ProductImageService {
  readonly maxFileSize = 4 * 1024 * 1024;
  private readonly allowedTypes = new Set(['image/png', 'image/jpeg', 'image/webp']);

  validate(file: File): ImageValidationResult {
    if (!this.allowedTypes.has(file.type)) {
      return { valid: false, message: 'Seleziona un file immagine valido.' };
    }
    if (file.size > this.maxFileSize) {
      return { valid: false, message: "Seleziona un'immagine più leggera di 4 MB." };
    }
    return { valid: true };
  }

  prepare(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Lettura immagine non riuscita.'));
      reader.onload = () => {
        const image = new Image();
        image.onerror = () => reject(new Error('Formato immagine non leggibile.'));
        image.onload = () => {
          const maxSize = 640;
          const ratio = Math.min(1, maxSize / Math.max(image.width, image.height));
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          if (!context) return reject(new Error('Canvas non disponibile.'));

          canvas.width = Math.max(1, Math.round(image.width * ratio));
          canvas.height = Math.max(1, Math.round(image.height * ratio));
          context.fillStyle = '#ffffff';
          context.fillRect(0, 0, canvas.width, canvas.height);
          context.drawImage(image, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/webp', 0.82));
        };
        image.src = String(reader.result);
      };
      reader.readAsDataURL(file);
    });
  }
}
