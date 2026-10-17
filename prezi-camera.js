/**
 * Prezi-Style Spatial Camera Controller
 * Handles camera zoom-out, pan, zoom-in, dynamic card docking, and backdrops.
 */

class PreziCameraController {
  constructor(config) {
    this.world = document.getElementById(config.worldId);
    this.backdrop = document.getElementById(config.backdropId);
    this.journeyModal = document.getElementById(config.journeyModalId);
    this.sequence = config.sequence;
    
    this.activeCardId = 'cardMain';
    this.isTransitioning = false;
    
    this.initEventListeners();
  }

  // Calculate overview zoom scale to fit any laptop/tablet screen
  getFitScale() {
    const padding = 120; // Clearance for navbar & bottom bar
    const scaleX = (window.innerWidth - 80) / 2600;
    const scaleY = (window.innerHeight - padding) / 1000;
    return Math.min(scaleX, scaleY);
  }

  // Core Prezi Transition Engine
  async transitionToNode(targetId) {
    if (this.isTransitioning && targetId === this.activeCardId) return;
    this.isTransitioning = true;

    // 1. Undock previous card & close overlay graphics
    this.sequence.forEach(id => {
      const card = document.getElementById(id);
      if (card) card.classList.remove('docked-top-left', 'active-node');
    });

    if (this.backdrop) this.backdrop.classList.remove('active');
    if (this.journeyModal) {
      this.journeyModal.classList.add('opacity-0', 'pointer-events-none');
      if (typeof stopJourneyAutoPlay === 'function') stopJourneyAutoPlay();
    }

    // 2. Prezi Effect Phase A: Quick Zoom-Out to World Overview
    const fitScale = this.getFitScale();
    this.world.style.transform = `translate(-50%, -50%) scale(${fitScale * 0.85})`;

    // If target is Main, stay at overview
    if (targetId === 'cardMain') {
      await this.sleep(400);
      this.world.style.transform = `translate(-50%, -50%) scale(${fitScale})`;
      this.activeCardId = 'cardMain';
      this.updateUI('cardMain');
      this.isTransitioning = false;
      return;
    }

    // 3. Prezi Effect Phase B: Pan & Zoom-In to Target Node
    await this.sleep(350); // Pause briefly at overview for spatial context

    const targetCard = document.getElementById(targetId);
    if (targetCard) {
      targetCard.classList.add('active-node');
      
      const cardX = targetCard.offsetLeft + targetCard.offsetWidth / 2;
      const cardY = targetCard.offsetTop + targetCard.offsetHeight / 2;
      const scale = Math.min(1.45, (window.innerHeight - 180) / targetCard.offsetHeight);

      const translateX = -cardX * scale + window.innerWidth / 2;
      const translateY = -cardY * scale + window.innerHeight / 2;

      this.world.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;

      // 4. Prezi Effect Phase C: Dock card and show detail overlays
      await this.sleep(500);
      targetCard.classList.add('docked-top-left');
      if (this.backdrop) this.backdrop.classList.add('active');

      if (targetId === 'cardPhase1' && this.journeyModal) {
        this.journeyModal.classList.remove('opacity-0', 'pointer-events-none');
        if (typeof setJourneyStep === 'function') setJourneyStep(0);
      }
    }

    this.activeCardId = targetId;
    this.updateUI(targetId);
    this.isTransitioning = false;
  }

  // Navigation Steps
  stepNext() {
    const currentIndex = this.sequence.indexOf(this.activeCardId);
    if (currentIndex < this.sequence.length - 1) {
      this.transitionToNode(this.sequence[currentIndex + 1]);
    } else {
      this.transitionToNode('cardMain');
    }
  }

  stepPrev() {
    const currentIndex = this.sequence.indexOf(this.activeCardId);
    if (currentIndex > 0) {
      this.transitionToNode(this.sequence[currentIndex - 1]);
    } else {
      this.transitionToNode('cardMain');
    }
  }

  resetZoom() {
    this.transitionToNode('cardMain');
  }

  updateUI(currentId) {
    const btnMain = document.getElementById('btnMain');
    const btnNext = document.getElementById('btnNext');
    if (!btnMain || !btnNext) return;

    btnMain.classList.remove('blink-slow');
    btnNext.classList.remove('blink-slow');

    const currentIndex = this.sequence.indexOf(currentId);

    if (currentId === 'cardPhase4Page1' || (currentIndex >= 0 && currentIndex < this.sequence.length - 1)) {
      btnNext.classList.add('blink-slow');
    } else if (currentId === 'cardPresent') {
      btnMain.classList.add('blink-slow');
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  initEventListeners() {
    window.addEventListener('resize', () => {
      if (this.activeCardId === 'cardMain') {
        const fitScale = this.getFitScale();
        this.world.style.transform = `translate(-50%, -50%) scale(${fitScale})`;
      }
    });

    window.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === ' ') this.stepNext();
      else if (e.key === 'ArrowLeft') this.stepPrev();
      else if (e.key === 'Escape') this.resetZoom();
    });
  }
}