import {
  Component,
  ChangeDetectionStrategy,
  signal,
  inject,
  computed,
  OnInit,
  effect,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { DeviceService } from '../../services/device.service';
import { ToastService } from '../../services/toast.service';
import { GalleryService } from '../../services/gallery.service';
import { SettingsService } from '../../services/settings.service';
import { GenerationService } from '../../services/generation.service';
import {
  composePromptForDevice,
  computeExactFitTarget,
  DeviceInfo,
  ExactFitTarget,
  listImageModels,
  ImageOptions,
} from '../../services/pollinations.client';
import { FormsModule } from '@angular/forms';

interface StylePreset {
  name: string;
  styles: string[];
  suggestions: string[];
}

@Component({
  selector: 'pw-wizard',
  standalone: true,
  templateUrl: './wizard.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
  host: {
    '(document:click)': 'onDocumentClick($event)',
  },
})
export class WizardComponent implements OnInit {
  // --- Injected Services ---
  deviceService = inject(DeviceService);
  toastService = inject(ToastService);
  galleryService = inject(GalleryService);
  settingsService = inject(SettingsService);
  generationService = inject(GenerationService);

  // --- Local State ---
  process = signal<'compose' | null>(null);
  prompt = signal('');
  lastTarget = signal<ExactFitTarget | null>(null);

  // --- Image-to-Image ---
  sourceImageUrl = signal<string | null>(null);
  dragging = signal(false);
  isLocalSourceImage = computed(() => this.sourceImageUrl()?.startsWith('blob:') ?? false);
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  @ViewChild('historyButton') historyButton?: ElementRef<HTMLDivElement>;
  @ViewChild('historyDropdown') historyDropdown?: ElementRef<HTMLDivElement>;

  // --- Models & Settings ---
  availableModels = signal<string[]>([]);
  selectedModel = signal('flux');
  seed = signal<number | undefined>(undefined);
  enhancePrompt = signal(true);

  // --- Computed State from Service & Local ---
  loading = computed(
    () =>
      this.process() === 'compose' ||
      this.generationService.status() === 'generating' ||
      this.generationService.status() === 'saving'
  );

  status = computed(() => {
    if (this.process() === 'compose') {
      return 'Composing prompt';
    }
    const genStatus = this.generationService.status();
    if (genStatus === 'generating' || genStatus === 'saving' || genStatus === 'error') {
      return this.generationService.statusMessage();
    }
    return '';
  });

  generatedImageUrl = computed(() => this.generationService.currentGenerationResult()?.blobUrl ?? null);

  readonly baseQualityStyles = ['ultra-high quality', 'hyperrealistic photography', '8K resolution', 'insane detail'];

  presets: StylePreset[] = [
    {
      name: 'Vivid & Vibrant',
      styles: ['Vibrant colors', 'Dynamic lighting', 'Crisp focus', 'Rich textures'],
      suggestions: [
        'A sun-drenched tropical beach with crystal-clear turquoise water and lush palm trees, hyperrealistic.',
        'Close-up of a brilliantly colored exotic bird, its feathers showing iridescent detail.',
        'A bustling city street at night, illuminated by a symphony of vibrant neon signs and reflections on wet pavement.',
      ],
    },
    {
      name: 'Dark & Moody',
      styles: ['Deep shadows', 'Dramatic contrast', 'Cinematic low-key lighting', 'Muted color palette'],
      suggestions: [
        'A lone figure standing on a foggy, moonlit cliff overlooking a stormy sea.',
        'An ancient, moss-covered stone staircase descending into a dark, mysterious forest.',
        'A dimly lit, vintage library with towering bookshelves and a single leather armchair under a warm reading lamp.',
      ],
    },
    {
      name: 'Minimalist & Clean',
      styles: ['Clean composition', 'Soft natural light', 'Minimalist aesthetic', 'Smooth textures'],
      suggestions: [
        'A single, perfect white orchid in a minimalist ceramic vase against a soft grey background.',
        'Sunlight creating long, soft shadows across an empty, serene concrete interior space.',
        'The clean, flowing lines of a modern architectural facade, shot from a low angle against a clear blue sky.',
      ],
    },
    {
      name: 'Dreamy & Ethereal',
      styles: ['Soft focus', 'Ethereal glow', 'Pastel color palette', 'Dream-like atmosphere'],
      suggestions: [
        'A misty forest path at dawn, with sunbeams filtering through the canopy creating a magical, ethereal glow.',
        'Bioluminescent jellyfish floating gracefully in the deep, dark ocean, emitting a soft, otherworldly light.',
        'A field of glowing lavender under a starry night sky with a hazy, dream-like aurora borealis.',
      ],
    },
    {
      name: 'Hyper-Detailed Nature',
      styles: ['Macro photography', 'Intricate details', 'Natural textures', 'Lush greenery'],
      suggestions: [
        "Extreme close-up of a dragonfly's iridescent wing, showing the intricate, vein-like patterns.",
        'The complex, fractal-like patterns of frost crystals forming on a dark window pane.',
        'A hyper-detailed macro shot of a dewdrop on a blade of grass, reflecting the surrounding landscape.',
      ],
    },
    {
      name: 'Architectural Realism',
      styles: [
        'Crisp architectural lines',
        'Realistic materials (concrete, glass, steel)',
        'Natural daylight illumination',
        'Detailed textures',
      ],
      suggestions: [
        'The sun setting over a modern brutalist concrete building, casting long, dramatic shadows.',
        'Interior of a light-filled Scandinavian-style living room with minimalist furniture and natural wood textures.',
        "A detailed shot of a historic stone cathedral's facade, capturing the intricate carvings and weathered textures.",
      ],
    },
    {
      name: 'Sci-Fi Hyperdetail',
      styles: [
        'Intricate mechanical details',
        'Greebling and paneling',
        'Complex machinery',
        'Cinematic sci-fi lighting',
        'Polished metallic surfaces',
      ],
      suggestions: [
        'The cockpit of a futuristic starship, filled with glowing holographic displays and complex control panels.',
        'A massive, intricately detailed robotic arm assembling a microchip in a sterile, high-tech factory.',
        'Close-up on the weathered, battle-damaged helmet of a futuristic soldier, reflecting a desolate alien landscape.',
      ],
    },
    {
      name: 'Photorealistic Portrait',
      styles: [
        'Shallow depth of field',
        'Detailed skin texture',
        'Expressive catchlights in eyes',
        'Soft, natural lighting',
      ],
      suggestions: [
        'An elderly man with deep wrinkles and kind eyes, his face telling a story, lit by a soft window light.',
        'A candid portrait of a woman laughing, with a shallow depth of field blurring the background city lights.',
        'A dramatic, high-contrast black and white portrait of an athlete, with sweat beading on their determined face.',
      ],
    },
  ];

  selectedPreset = signal<StylePreset>(this.presets[0]);

  currentStyles = computed(() => [...this.selectedPreset().styles, ...this.baseQualityStyles]);

  private readonly historyKey = 'polliwall.promptHistory';
  private readonly wizardSettingsKey = 'polliwall.wizardSettings';
  promptHistory = signal<string[]>([]);
  isHistoryOpen = signal(false);

  supported: Record<string, Array<{ w: number; h: number }>> = {
    '9:19.5': [
      { w: 1170, h: 2532 },
      { w: 1284, h: 2778 },
    ],
    '9:19': [
      { w: 1080, h: 2280 },
      { w: 1440, h: 3040 },
      { w: 1440, h: 3120 },
    ],
    '9:16': [
      { w: 1080, h: 1920 },
      { w: 1440, h: 2560 },
      { w: 2160, h: 3840 },
    ],
    '3:4': [
      { w: 1536, h: 2048 },
      { w: 2048, h: 2732 },
    ],
    '16:10': [{ w: 2560, h: 1600 }],
    '16:9': [{ w: 3840, h: 2160 }],
  };

  constructor() {
    this.loadWizardSettings();

    effect(() => {
      this.saveWizardSettings();
    });
  }

  ngOnInit(): void {
    this.loadHistory();
    this.loadModels();
  }

  onDocumentClick(event: Event): void {
    if (!this.isHistoryOpen()) {
      return;
    }
    const target = event.target as Node;

    if (this.historyButton?.nativeElement.contains(target)) {
      return;
    }

    if (this.historyDropdown && !this.historyDropdown.nativeElement.contains(target)) {
      this.isHistoryOpen.set(false);
    }
  }

  // --- Type-safe event handlers ---
  onPromptInput(event: Event): void {
    this.prompt.set((event.target as HTMLTextAreaElement).value);
  }

  onSeedInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    const num = parseInt(value, 10);
    this.seed.set(isNaN(num) ? undefined : num);
  }

  onEnhancePromptChange(event: Event): void {
    this.enhancePrompt.set((event.target as HTMLInputElement).checked);
  }

  onModelChange(event: Event): void {
    this.selectedModel.set((event.target as HTMLSelectElement).value);
  }

  onPrivateChange(event: Event): void {
    this.settingsService.private.set((event.target as HTMLInputElement).checked);
  }

  onSafeChange(event: Event): void {
    this.settingsService.safe.set((event.target as HTMLInputElement).checked);
  }
  // --- End of type-safe event handlers ---

  private loadWizardSettings(): void {
    const saved = localStorage.getItem(this.wizardSettingsKey);
    if (saved) {
      try {
        const settings = JSON.parse(saved);
        if (settings.selectedModel) {
          this.selectedModel.set(settings.selectedModel);
        }
        if (typeof settings.enhancePrompt === 'boolean') {
          this.enhancePrompt.set(settings.enhancePrompt);
        }
        if ('seed' in settings && (settings.seed === null || typeof settings.seed === 'number')) {
          this.seed.set(settings.seed ?? undefined);
        }
      } catch (e) {
        console.error('Failed to parse wizard settings from localStorage', e);
        localStorage.removeItem(this.wizardSettingsKey);
      }
    }
  }

  private saveWizardSettings(): void {
    const settings = {
      selectedModel: this.selectedModel(),
      enhancePrompt: this.enhancePrompt(),
      seed: this.seed(),
    };
    localStorage.setItem(this.wizardSettingsKey, JSON.stringify(settings));
  }

  async loadModels(): Promise<void> {
    try {
      const models = await listImageModels();
      this.availableModels.set(models);
      if (!models.includes(this.selectedModel())) {
        this.selectedModel.set(models.includes('flux') ? 'flux' : models[0] || '');
      }
    } catch (e) {
      this.toastService.show('Could not load image models.');
      console.error(e);
    }
  }

  generateRandomSeed(): void {
    this.seed.set(Math.floor(Math.random() * 1000000000));
    this.toastService.show('New random seed generated.');
  }

  private loadHistory(): void {
    const saved = localStorage.getItem(this.historyKey);
    if (saved) {
      try {
        this.promptHistory.set(JSON.parse(saved));
      } catch {
        this.promptHistory.set([]);
      }
    }
  }

  private updateHistory(newPrompt: string): void {
    if (!newPrompt) return;
    const currentHistory = this.promptHistory().filter((p) => p !== newPrompt);
    const updatedHistory = [newPrompt, ...currentHistory].slice(0, 10);
    this.promptHistory.set(updatedHistory);
    localStorage.setItem(this.historyKey, JSON.stringify(updatedHistory));
  }

  useHistoryPrompt(p: string): void {
    this.prompt.set(p);
    this.isHistoryOpen.set(false);
    this.toastService.show('Loaded prompt from history.');
  }

  clearHistory(): void {
    this.promptHistory.set([]);
    localStorage.removeItem(this.historyKey);
    this.isHistoryOpen.set(false);
    this.toastService.show('Prompt history cleared.');
  }

  useSuggestion(suggestion: string): void {
    this.prompt.set(suggestion);
  }

  clearSourceImage(): void {
    const currentUrl = this.sourceImageUrl();
    if (currentUrl) {
      URL.revokeObjectURL(currentUrl);
    }
    this.sourceImageUrl.set(null);
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }

  private handleImageFile(file: File): void {
    if (!file.type.startsWith('image/')) {
      this.toastService.show('Please select an image file.');
      return;
    }
    this.clearSourceImage();
    const url = URL.createObjectURL(file);
    this.sourceImageUrl.set(url);
    this.toastService.show('Image loaded for inspiration.');
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(false);
    const file = event.dataTransfer?.files[0];
    if (file) {
      this.handleImageFile(file);
    }
  }

  onFileInputChange(event: Event): void {
    const file = (event.target as HTMLInputElement)?.files?.[0];
    if (file) {
      this.handleImageFile(file);
    }
  }

  async compose(): Promise<void> {
    this.process.set('compose');

    // Reset any previous generation result when starting a new composition.
    const genStatus = this.generationService.status();
    if (genStatus === 'success' || genStatus === 'error' || genStatus === 'idle') {
      this.generationService.reset();
    }
    this.clearSourceImage();

    try {
      const info = this.deviceService.getInfo();
      const currentPrompt = this.prompt().trim();
      const text = await composePromptForDevice(
        info,
        {
          styles: this.currentStyles(),
          basePrompt: currentPrompt,
        },
        { referrer: this.settingsService.referrer(), private: this.settingsService.private() }
      );
      this.prompt.set(text);
      this.updateHistory(text);
      const target = computeExactFitTarget(info, this.supported);
      this.lastTarget.set(target);
      this.toastService.show(`Composed prompt for ${target.width}x${target.height}`);
    } catch (e: unknown) {
      const error = e as Error;
      this.toastService.show(`Compose failed: ${error.message || String(e)}`);
    } finally {
      this.process.set(null);
    }
  }

  public async generate(): Promise<void> {
    const text = this.prompt().trim();
    if (!text && !this.sourceImageUrl()) {
      this.toastService.show('Please compose or enter a prompt.');
      return;
    }
    if (this.isLocalSourceImage()) {
      this.toastService.show('Cannot generate: Local images can only be used for preview.');
      return;
    }

    this.updateHistory(text);
    const info: DeviceInfo = this.deviceService.getInfo();
    const isImg2Img = !!this.sourceImageUrl();

    const options: ImageOptions = {
      referrer: this.settingsService.referrer(),
      nologo: this.settingsService.nologo(),
      private: this.settingsService.private(),
      safe: this.settingsService.safe(),
      model: isImg2Img ? 'kontext' : this.selectedModel(),
      seed: this.seed(),
      image: this.sourceImageUrl() ?? undefined,
      enhance: !isImg2Img && this.enhancePrompt(),
    };

    await this.generationService.generateWallpaper(text, options, info, this.supported, this.selectedPreset().name);
  }
}
