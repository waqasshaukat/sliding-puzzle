import { CommonModule } from '@angular/common';
import { Component, OnDestroy } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnDestroy {
  puzzle!: number[][];
  imageParts: string[] = [];
  originalImage!: HTMLImageElement;
  moves = 0;
  gameStarted = false;
  seconds = 0;
  timer!: any;
  won = true;

  constructor() {
    // this.puzzle = this.generatePuzzle();
  }

  ngOnInit(): void {}
  ngOnDestroy(): void {
    this.clearInterval();
  }

  clearInterval(){
    clearInterval(this.timer);
  }
  

  generatePuzzle(): number[][] {
    let numbers = Array.from({ length: 9 }, (_, i) => i);
    this.shuffle(numbers);
    let puzzle = [];
    for (let i = 0; i < 3; i++) {
      puzzle.push(numbers.slice(i * 3, i * 3 + 3));
    }
    console.log('puzzle: ', puzzle);
    return puzzle;
  }

  shuffle(array: number[]): void {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.originalImage = new Image();
        this.originalImage.src = e.target.result;
        this.originalImage.onload = () => {
          this.splitImage();
        };
      };
      reader.readAsDataURL(input.files[0]);
    }
  }

  splitImage(): void {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    const tileSize = this.originalImage.width / 3;
    this.imageParts = [];

    canvas.width = tileSize;
    canvas.height = tileSize;

    for (let y = 0; y < 3; y++) {
      for (let x = 0; x < 3; x++) {
        context?.clearRect(0, 0, tileSize, tileSize);
        context?.drawImage(
          this.originalImage,
          x * tileSize,
          y * tileSize,
          tileSize,
          tileSize,
          0,
          0,
          tileSize,
          tileSize
        );
        if (x !== 2 || y !== 2) {
          this.imageParts.push(canvas.toDataURL());
        } else {
          this.imageParts.push(''); // Placeholder for the empty tile
        }
      }
    }
    console.log('image parts: ', this.imageParts);
    this.shuffleImageParts();
  }

  shuffleImageParts(): void {
    this.puzzle = this.generatePuzzle();
  }

  get timeString(){
    let seconds = this.seconds % 60;
    let hours = Math.floor(this.seconds / 60);
    if(seconds.toString().length === 1){
      seconds = '0'+seconds as unknown as number;
    } 
    if(hours.toString().length === 1){
      hours = '0'+hours as unknown as number;
    }
    return `${hours}:${seconds}`;
  }

  startTimer(){
    this.timer = setInterval(() => {
      this.seconds += 1;
    }, 1000)
  }

  onDragStart(event: DragEvent): void {
    if(!this.gameStarted){
      this.gameStarted = true;
      this.startTimer();
    }
    const target = event.target as HTMLElement;
    console.log('event.target: ', event.target)
    const row = target.getAttribute('data-row');
    const col = target.getAttribute('data-col');
    console.log('onDragStart: row, col ', row, col);
    if (row !== null && col !== null) {
      event.dataTransfer?.setData('abc', `[${row},${col}]`);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault(); // Necessary to allow dropping
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    const target = event.target as HTMLElement;
    const destRow = target.getAttribute('data-row');
    const destCol = target.getAttribute('data-col');
    const data = event.dataTransfer?.getData('abc');
    if (data && destRow !== null && destCol !== null) {
      console.log('inside onDrop if type of data: ', typeof JSON.parse(data));
      const [srcRow, srcCol] = JSON.parse(data);
      console.log('srcRow, srcCol ', srcRow, srcCol);
      if (!isNaN(srcRow) && !isNaN(srcCol) && !isNaN(Number(destRow)) && !isNaN(Number(destCol))) {
        this.moveTile(srcRow, srcCol, Number(destRow), Number(destCol));
      }
    }
  }

  moveTile(srcRow: number, srcCol: number, destRow: number, destCol: number): void {
    console.log('inside moveTile')
    if (this.isWithinBounds(srcRow, srcCol) && this.isWithinBounds(destRow, destCol) && this.puzzle[destRow][destCol] === 0) {
      this.swapTiles(srcRow, srcCol, destRow, destCol);
    }
  }

  swapTiles(row1: number, col1: number, row2: number, col2: number): void {
    console.log('inside swapTiles: ');
    [this.puzzle[row1][col1], this.puzzle[row2][col2]] = [this.puzzle[row2][col2], this.puzzle[row1][col1]];
    this.moves += 1;
    console.log('After swap this.puzzle: ', this.puzzle);
    console.log('win: ',this.checkForWinCombination());
  }

  checkForWinCombination(): boolean{
    let count = 1;
    for(let r = 0; r < 3; r++){
      for(let c = 0; c < 3; c++ ){
        if(this.puzzle[r][c] !== count%9){
          return false
        }
        count++;
      }
    }
    this.clearInterval();
    this.won = true;
    return true;
  }

  isWithinBounds(row: number, col: number): boolean {
    return row >= 0 && row < 3 && col >= 0 && col < 3;
  }

  getTileOffsetX(index: number): string {
    return `${-(index % 3) * 100}px`;
  }

  getTileOffsetY(index: number): string {
    return `${-Math.floor(index / 3) * 100}px`;
  }

  isTileDraggable(row: number, col: number): boolean {
    // Find the position of the empty tile (tile 0)
    let emptyRow: number, emptyCol: number;
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        if (this.puzzle[i][j] === 0) {
          emptyRow = i;
          emptyCol = j;
          break;
        }
      }
    }

    // Check if the current tile is adjacent to the empty tile
    const isAdjacent =
      (row === emptyRow! && Math.abs(col - emptyCol!) === 1) ||
      (col === emptyCol! && Math.abs(row - emptyRow!) === 1);

    return isAdjacent;
  }
}
