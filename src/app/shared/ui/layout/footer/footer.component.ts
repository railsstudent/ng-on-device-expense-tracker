import { Component } from '@angular/core';

@Component({
  selector: 'app-footer',
  imports: [],
  template: `
    <footer class="app-footer">
      <div class="footer-container">
        <p class="footer-text">
          &copy; 2026 On-device Expense Tracker. Built with Angular, Gemma 4, LiteRT LM Web SDK &amp; Tailwind.
        </p>
      </div>
    </footer>
  `,
  styleUrls: ['./footer.component.css'],
})
export class FooterComponent {}
