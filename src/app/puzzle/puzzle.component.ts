import { animate, transition, trigger } from '@angular/animations';
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import * as confetti from 'canvas-confetti';

@Component({
  selector: 'app-puzzle',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './puzzle.component.html',
  styleUrls: ['./puzzle.component.css'],
  animations: [
    trigger("tileSlide", [
      transition("* => *", [
        animate("200ms ease-out")
      ])
    ])
  ]
})
export class PuzzleComponent implements OnInit {
  tiles: number[] = [];
  gridSize: number = 3;
  moves: number = 0;
  gameComplete: boolean = false;
  baseSize: number = 500;
  tileWidth: number = 0;
  tileHeight: number = 0;
  imageUrl: string = "https://picsum.photos/500/500";
  showComplete: boolean = false;
  availableImages: any;
  timer: number = 10;
  maxTime: number = 10;
  timerInterval: any;
  maxMoves: number = 500;
  moveWeight: number = 10;
  timeWeight: number = 5;
  score: number = 0;
  timeTaken: number = 0;
  difficulty: number = 2; //Difficulty levels: 1 -> 2x2, 2 -> 3x3, 3 -> 4x4, 4 -> 5x5, 5 -> 6x6

  constructor(private router: Router) {}

  ngOnInit() {
    this.updateGridSize();
    this.tileWidth = this.baseSize / this.gridSize;
    this.tileHeight = this.baseSize / this.gridSize;
    this.initializePuzzle();
  }

  updateGridSize() {
    switch (this.difficulty) {
      case 1:
        this.gridSize = 2;
        this.maxTime = 10;
        break;
      case 2:
        this.gridSize = 3;
        this.maxTime = 150;
        break;
      case 3:
        this.gridSize = 4;
        this.maxTime = 300;
        break;
      case 4:
        this.gridSize = 5;
        this.maxTime = 600
        break;
      case 5:
          this.gridSize = 6;
          this.maxTime = 1000;
        break;
      default:
        this.gridSize = 3;
        this.maxTime = 150;
        break;
    }
  }

  initializePuzzle() {
    clearInterval(this.timerInterval);
    this.tiles = Array.from({ length: this.gridSize * this.gridSize - 1 }, (_, i) => i + 1);
    this.tiles.push(0);
    this.shuffleTiles();
    this.moves = 0;
    this.gameComplete = false;
    this.showComplete = false;
    this.timer = this.maxTime;
    this.updateGridSize();
  }

  goToHome() {
    this.router.navigate(['/']);
  }

  shuffleTiles() {
    for (let i = this.tiles.length-1; i>0; i--) {
      const j = Math.floor(Math.random() * (i+1));
      [this.tiles[i], this.tiles[j]] = [this.tiles[j], this.tiles[i]];
    }

    if (!this.isSolvable()) this.shuffleTiles();
  }

  isSolvable(): boolean {
    let inversions = 0;
    for (let i=0; i<this.tiles.length-1; i++) {
      for (let j = i+1; j<this.tiles.length; j++) {
        if (this.tiles[i] && this.tiles[j] && this.tiles[i] > this.tiles[j]) inversions++;
      }
    }
    return inversions % 2 === 0;
  }

  moveTile(index: number) {
    const emptyIndex = this.tiles.indexOf(0);
    if (this.isValidMove(index, emptyIndex)) {
      [this.tiles[index], this.tiles[emptyIndex]] = [this.tiles[emptyIndex], this.tiles[index]];
      if (this.moves === 0)
        this.startTimer();
      this.moves++;
      this.checkWin();
    }
  }

  isValidMove(index: number, emptyIndex: number): boolean {
    const row = Math.floor(index / this.gridSize);
    const emptyRow = Math.floor(emptyIndex / this.gridSize);
    const col = index % this.gridSize;
    const emptyCol = emptyIndex % this.gridSize;

    return (
      (Math.abs(row - emptyRow) === 1 && col === emptyCol) ||
      (Math.abs(col - emptyCol) === 1 && row === emptyRow)
    );
  }

  checkWin() {
    const isComplete = this.tiles.every((tile, index) =>
      index === this.tiles.length - 1 ? tile === 0 : tile === index+1
    );

    if (isComplete) {
      this.gameComplete = true;
      this.showComplete = true;
      setTimeout(() => {
        this.fireConfetti();
      }, 500);
    }
  }

  fireConfetti() {
    const myConfetti = confetti.create(undefined, {
      resize: true,
      useWorker: true
    });

    const count = 200;
    const defaults = {
      origin: { y: 0.7 }
    };

    function fire(particleRatio: number, opts: any) {
      myConfetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count*particleRatio),
        spread: 26,
        startVelocity: 55,
      });
    }

    fire(0.25, { spread: 26, startVelocity: 55 });
    fire(0.2, { spread: 60 });
    fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
    fire(0.1, { spread: 120, startVelocity: 45 });
  }

  getTileStyle(index: number) {
    const tile = this.tiles[index];
    if (tile === 0) return { visibility: "hidden" };

    const row = Math.floor((tile - 1) / this.gridSize);
    const col = (tile-1) % this.gridSize;
    const currentRow = Math.floor(index / this.gridSize);
    const currentCol = index % this.gridSize;

    return {
      backgroundImage: `url(${this.imageUrl})`,
      backgroundSize: `${this.gridSize * 100}%`,
      backgroundPosition: `-${col * 100}% -${row * 100}%`,
      width: `${this.tileWidth}px`,
      height: `${this.tileHeight}px`,
      transform: `translate(${currentCol * this.tileWidth}px, ${currentRow * this.tileHeight}px)`
    };
  }

  getTilePosition(index: number) {
    const row = Math.floor(index / this.gridSize);
    const col = index % this.gridSize;
    return `translate(${col * this.tileWidth}px, ${row * this.tileHeight}px)`;
  }

  getAnimationState(index: number) {
    return {
      value: this.tiles[index],
      params: { tileTransform: this.getTilePosition(index) }
    };
  }

  changeImage(index: number) {
    this.imageUrl = this.availableImages[index];
    this.initializePuzzle();
  }

  startTimer() {
    if (this.gameComplete) return;
  
    this.timerInterval = setInterval(() => {
      if (this.timer > 0 && !this.gameComplete) {
        this.timer--;
      } else {
        this.endGame();
      }
    }, 1000);
  }

  endGame() {
    clearInterval(this.timerInterval);
    this.gameComplete = true;
    this.timeTaken = this.timer === 0 ? this.maxTime : this.maxTime - this.timer; 
    this.calculateScore();
  }

  getTimerDisplay(time: number = this.timer): string {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  }

  calculateScore() {
    if (!this.gameComplete) return 0;
    const baseScore = 100;
    const moveScore = (this.maxMoves - this.moves) * this.moveWeight;
    const timeScore = Math.floor((this.timer / this.timer) * this.timeWeight);
    
    this.score = baseScore + moveScore + timeScore;
    return this.score;
  }
}
