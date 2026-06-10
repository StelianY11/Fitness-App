import { Component } from '@angular/core';
import { MobileShellComponent } from './layout/mobile-shell/mobile-shell.component';

@Component({
  selector: 'app-root',
  imports: [MobileShellComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
}
