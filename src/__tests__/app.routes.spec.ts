/**
 * App Routes Test Suite
 * Tests for Angular route configuration
 */

import { routes } from '../app.routes';

describe('App Routes', () => {
  describe('Route configuration', () => {
    it('should have routes defined', () => {
      expect(routes).toBeDefined();
      expect(Array.isArray(routes)).toBe(true);
      expect(routes.length).toBeGreaterThan(0);
    });

    it('should have root path route', () => {
      const rootRoute = routes.find((r) => r.path === '');
      expect(rootRoute).toBeDefined();
      expect(rootRoute?.title).toBe('PolliWall – Create');
    });

    it('should have gallery route', () => {
      const galleryRoute = routes.find((r) => r.path === 'gallery');
      expect(galleryRoute).toBeDefined();
      expect(galleryRoute?.title).toBe('PolliWall – Gallery');
    });

    it('should have collections route', () => {
      const collectionsRoute = routes.find((r) => r.path === 'collections');
      expect(collectionsRoute).toBeDefined();
      expect(collectionsRoute?.title).toBe('PolliWall – Collections');
    });

    it('should have feed route', () => {
      const feedRoute = routes.find((r) => r.path === 'feed');
      expect(feedRoute).toBeDefined();
      expect(feedRoute?.title).toBe('PolliWall – Community Feed');
    });

    it('should have editor route with id parameter', () => {
      const editorRoute = routes.find((r) => r.path === 'edit/:id');
      expect(editorRoute).toBeDefined();
      expect(editorRoute?.title).toBe('PolliWall – Editor');
    });

    it('should have settings route', () => {
      const settingsRoute = routes.find((r) => r.path === 'settings');
      expect(settingsRoute).toBeDefined();
      expect(settingsRoute?.title).toBe('PolliWall – Settings');
    });

    it('should have wildcard redirect route', () => {
      const wildcardRoute = routes.find((r) => r.path === '**');
      expect(wildcardRoute).toBeDefined();
      expect(wildcardRoute?.redirectTo).toBe('');
    });

    it('should have 7 routes total', () => {
      expect(routes.length).toBe(7);
    });
  });

  describe('Lazy loading configuration', () => {
    it('should have loadComponent for root route', () => {
      const rootRoute = routes.find((r) => r.path === '');
      expect(rootRoute?.loadComponent).toBeDefined();
      expect(typeof rootRoute?.loadComponent).toBe('function');
    });

    it('should have loadComponent for gallery route', () => {
      const galleryRoute = routes.find((r) => r.path === 'gallery');
      expect(galleryRoute?.loadComponent).toBeDefined();
      expect(typeof galleryRoute?.loadComponent).toBe('function');
    });

    it('should have loadComponent for collections route', () => {
      const collectionsRoute = routes.find((r) => r.path === 'collections');
      expect(collectionsRoute?.loadComponent).toBeDefined();
      expect(typeof collectionsRoute?.loadComponent).toBe('function');
    });

    it('should have loadComponent for feed route', () => {
      const feedRoute = routes.find((r) => r.path === 'feed');
      expect(feedRoute?.loadComponent).toBeDefined();
      expect(typeof feedRoute?.loadComponent).toBe('function');
    });

    it('should have loadComponent for editor route', () => {
      const editorRoute = routes.find((r) => r.path === 'edit/:id');
      expect(editorRoute?.loadComponent).toBeDefined();
      expect(typeof editorRoute?.loadComponent).toBe('function');
    });

    it('should have loadComponent for settings route', () => {
      const settingsRoute = routes.find((r) => r.path === 'settings');
      expect(settingsRoute?.loadComponent).toBeDefined();
      expect(typeof settingsRoute?.loadComponent).toBe('function');
    });

    it('should not have loadComponent for wildcard route', () => {
      const wildcardRoute = routes.find((r) => r.path === '**');
      expect(wildcardRoute?.loadComponent).toBeUndefined();
    });
  });

  describe('Route properties', () => {
    it('all routes with loadComponent should have titles', () => {
      const routesWithLoadComponent = routes.filter((r) => r.loadComponent);
      routesWithLoadComponent.forEach((route) => {
        expect(route.title).toBeDefined();
        expect(typeof route.title).toBe('string');
      });
    });

    it('wildcard route should have redirectTo but no title', () => {
      const wildcardRoute = routes.find((r) => r.path === '**');
      expect(wildcardRoute?.redirectTo).toBeDefined();
      expect(wildcardRoute?.title).toBeUndefined();
    });

    it('editor route should have path parameter', () => {
      const editorRoute = routes.find((r) => r.path?.includes(':id'));
      expect(editorRoute).toBeDefined();
      expect(editorRoute?.path).toBe('edit/:id');
    });
  });
});
