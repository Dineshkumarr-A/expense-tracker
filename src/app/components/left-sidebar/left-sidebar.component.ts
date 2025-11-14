import { Component, input, output } from '@angular/core';
import { navData, NavItem } from './nav-data';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NgbCollapse } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-left-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, NgbCollapse],
  templateUrl: './left-sidebar.component.html',
  styleUrl: './left-sidebar.component.css',
})
export class LeftSidebarComponent {
  isCollapsed = input.required<boolean>();
  toggleSideBar = output<boolean>();

  navBar: NavItem[] = navData.map((item) => ({
    ...item,
    expanded: false,
  }));

  toggleCollapse(): void {
    this.toggleSideBar.emit(!this.isCollapsed());
    this.navBar.forEach((item) => (item.expanded = false));
  }

  toggleExpand(item: NavItem): void {
    item.expanded = !item.expanded;
    console.log(this.isCollapsed());
  }

  closeSideNav(): void {
    this.toggleSideBar.emit(true);
  }
}
