import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: '',
        loadComponent: () => import('./components/wizard/wizard.component').then(m => m.WizardComponent),
        title: 'PolliWall – Create'
    },
    {
        path: 'gallery',
        loadComponent: () => import('./components/gallery/gallery.component').then(m => m.GalleryComponent),
        title: 'PolliWall – Gallery'
    },
    {
        path: 'collections',
        loadComponent: () => import('./components/collections/collections.component').then(m => m.CollectionsComponent),
        title: 'PolliWall – Collections'
    },
    {
        path: 'feed',
        loadComponent: () => import('./components/feed/feed.component').then(m => m.FeedComponent),
        title: 'PolliWall – Community Feed'
    },
    {
        path: 'edit/:id',
        loadComponent: () => import('./components/editor/editor.component').then(m => m.EditorComponent),
        title: 'PolliWall – Editor'
    },
    {
        path: 'settings',
        loadComponent: () => import('./components/settings/settings.component').then(m => m.SettingsComponent),
        title: 'PolliWall – Settings'
    },
    { path: '**', redirectTo: '' }
];
