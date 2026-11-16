import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Icons } from '@/components/icons';
import { AppHeader } from '@/components/header';
import { AppFooter } from '@/components/footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { OwnerDashboard } from '@/components/profit-chart';
import { ScrollProvider } from '@/lib/scroll-observer';
import Scene from '@/components/scene';

export default function Home() {
  const problemImage = PlaceHolderImages.find(p => p.id === 'problem-image');
  const customerAvatar = PlaceHolderImages.find(p => p.id === 'customer-avatar');
  const phoneImage = PlaceHolderImages.find(p => p.id === 'phone-image');
  const heroBackground = PlaceHolderImages.find(p => p.id === 'hero-background');

  return (
    <ScrollProvider numScenes={5}>
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <AppHeader />

      <main className="relative">
        <Scene />
        <div className="relative z-0">
            {/* Scene 1: Hero */}
            <div className="section-content">
                {heroBackground && (
                  <Image
                    src={heroBackground.imageUrl}
                    alt={heroBackground.description}
                    fill
                    className="object-cover blur-sm"
                    data-ai-hint={heroBackground.imageHint}
                  />
                )}
                <div className="relative z-10 flex flex-col items-center text-center">
                  <Icons.logo className="h-24 w-24 mb-4 text-primary" />
                  <h2 className="text-5xl md:text-7xl font-bold tracking-tight">Your AI Shopping Future.</h2>
                  <p className="mt-4 text-lg text-muted-foreground max-w-lg">
                      An immersive journey into the next generation of retail, powered by AI and 3D visualization.
                  </p>
                </div>
            </div>
            {/* Scene 2: The Problem */}
            <div className="section-content">
              <Card className="w-full max-w-3xl bg-card/80 backdrop-blur-sm overflow-hidden shadow-2xl">
                <CardContent className="p-0">
                  {problemImage && (
                    <Image
                      src={problemImage.imageUrl}
                      alt={problemImage.description}
                      width={1280}
                      height={720}
                      className="w-full h-auto object-cover"
                      data-ai-hint={problemImage.imageHint}
                    />
                  )}
                </CardContent>
              </Card>

              <h3 className="text-3xl font-bold mt-8">Welcome to Your Shopping Dashboard</h3>
              <p className="text-muted-foreground mt-2 max-w-xl">
                Get personalized offers, see nearby supermarkets, and continue your shopping journey with ease.
              </p>
            </div>
            <div className="section-content grid md:grid-cols-3 gap-8 mt-8">
              <Card className="bg-card/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>Offers & Discounts</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>See exclusive deals and discounts for you.</p>
                </CardContent>
              </Card>
              <Card className="bg-card/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>Nearby Supermarkets</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>Find stores near you using GPS.</p>
                </CardContent>
              </Card>
              <Card className="bg-card/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>Continue Shopping</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>Quickly resume your last shopping session.</p>
                </CardContent>
              </Card>
            </div>
        </div>
      </main>

      <AppFooter />
    </div>
    </ScrollProvider>
  );
}
