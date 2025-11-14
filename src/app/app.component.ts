import { Component, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { LeftSidebarComponent } from './components/left-sidebar/left-sidebar.component';
import { MainComponent } from './components/main/main.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterModule, LeftSidebarComponent, MainComponent],
  templateUrl: './app.component.html',
})
export class AppComponent {
  isSidebarCollapsed = signal<boolean>(false);
  screenWidth = signal<number>(window.innerWidth);

  //set initial value if the screen size is small
  ngOnInit() {
    this.onResize();
  }

  constructor() {
    window.addEventListener('resize', this.onResize.bind(this));
  }

  onResize(): void {
    this.screenWidth.set(window.innerWidth);
    if (window.innerWidth < 768) {
      this.isSidebarCollapsed.set(true);
    }
  }

  toggleSideBar(isCollapsed: boolean): void {
    this.isSidebarCollapsed.set(isCollapsed);
  }
}
