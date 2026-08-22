import { PwaAlertComponent } from '@/pwa-alert';
import { ToastContainerComponent } from '@/shared/ui/components/toast/toast-container.component';
import { FooterComponent } from '@/shared/ui/layout/footer/footer.component';
import { NavigationComponent } from '@/shared/ui/layout/navigation/navigation.component';
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavigationComponent, FooterComponent, ToastContainerComponent, PwaAlertComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {}
