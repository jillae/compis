
'use client'

import { useEffect } from 'react'
import Shepherd from 'shepherd.js'
import 'shepherd.js/dist/css/shepherd.css'

interface ProductTourProps {
  onComplete?: () => void
}

export function ProductTour({ onComplete }: ProductTourProps) {
  useEffect(() => {
    const tour = new Shepherd.Tour({
      defaultStepOptions: {
        cancelIcon: {
          enabled: true
        },
        classes: 'shepherd-theme-custom',
        scrollTo: { behavior: 'smooth', block: 'center' } as ScrollIntoViewOptions
      },
      useModalOverlay: true
    })
    
    tour.addStep({
      id: 'welcome',
      text: `
        <div class="tour-content">
          <h3 class="text-lg font-bold mb-2">Välkommen till Flow! 🎉</h3>
          <p class="text-gray-600 mb-3">
            Vi guidar dig genom de 3 viktigaste funktionerna som ger dig insikter redan idag.
          </p>
          <p class="text-sm text-gray-500">
            Detta tar bara 2 minuter.
          </p>
        </div>
      `,
      buttons: [
        {
          text: 'Hoppa över',
          secondary: true,
          action: function(this: any) {
            this.cancel()
          }
        },
        {
          text: 'Starta guiden',
          action: function(this: any) {
            this.next()
          }
        }
      ]
    })
    
    tour.addStep({
      id: 'dashboard',
      attachTo: {
        element: '[data-tour="dashboard"]',
        on: 'bottom'
      },
      text: `
        <div class="tour-content">
          <h3 class="text-lg font-bold mb-2">📊 Din Kontrollpanel</h3>
          <p class="text-gray-600 mb-3">
            Här ser du nyckeltal för din klinik: intäkter, bokningar, och kapacitet.
          </p>
          <p class="text-sm text-gray-500">
            All data uppdateras i realtid när du synkar med ditt bokningssystem.
          </p>
        </div>
      `,
      buttons: [
        {
          text: 'Tillbaka',
          secondary: true,
          action: function(this: any) {
            this.back()
          }
        },
        {
          text: 'Nästa',
          action: function(this: any) {
            this.next()
          }
        }
      ]
    })
    
    tour.addStep({
      id: 'customer-health',
      attachTo: {
        element: '[data-tour="customer-health"]',
        on: 'bottom'
      },
      text: `
        <div class="tour-content">
          <h3 class="text-lg font-bold mb-2">❤️ Kundhälsa</h3>
          <p class="text-gray-600 mb-3">
            Här ser du kunder som riskerar att churna och kan agera proaktivt.
          </p>
          <p class="text-sm text-gray-500">
            Klicka på en kund för att se detaljer och rekommenderade åtgärder.
          </p>
        </div>
      `,
      buttons: [
        {
          text: 'Tillbaka',
          secondary: true,
          action: function(this: any) {
            this.back()
          }
        },
        {
          text: 'Nästa',
          action: function(this: any) {
            this.next()
          }
        }
      ]
    })
    
    tour.addStep({
      id: 'import',
      attachTo: {
        element: '[data-tour="import"]',
        on: 'bottom'
      },
      text: `
        <div class="tour-content">
          <h3 class="text-lg font-bold mb-2">📥 Importera Data</h3>
          <p class="text-gray-600 mb-3">
            För att få full nytta, importera din bokningsdata här.
          </p>
          <p class="text-sm text-gray-500">
            Stöder Bokadirekt-integration eller CSV-import för alla bokningssystem.
          </p>
        </div>
      `,
      buttons: [
        {
          text: 'Tillbaka',
          secondary: true,
          action: function(this: any) {
            this.back()
          }
        },
        {
          text: 'Nästa',
          action: function(this: any) {
            this.next()
          }
        }
      ]
    })
    
    tour.addStep({
      id: 'complete',
      text: `
        <div class="tour-content">
          <h3 class="text-lg font-bold mb-2">Du är redo! 🚀</h3>
          <p class="text-gray-600 mb-3">
            Börja utforska på egen hand. Du kan alltid starta guiden igen via Guide-knappen.
          </p>
          <p class="text-sm text-blue-600 font-medium">
            Tips: Importera data först för att se riktiga insikter!
          </p>
        </div>
      `,
      buttons: [
        {
          text: 'Avsluta',
          action: function(this: any) {
            this.complete()
          }
        }
      ]
    })
    
    tour.on('complete', () => {
      if (onComplete) {
        onComplete()
      }
    })
    
    tour.on('cancel', () => {
      if (onComplete) {
        onComplete()
      }
    })
    
    tour.start()
    
    return () => {
      tour.complete()
    }
  }, [onComplete])

  return null
}
