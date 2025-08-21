
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Recycle, Truck, User, BarChart4, Map, Award } from 'lucide-react';

const Index = () => {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero section */}
      <section className="relative py-20 bg-gradient-to-b from-primary/20 to-background">
        <div className="container px-4 mx-auto">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              Smart Waste Management for Aligarh
            </h1>
            <p className="mt-6 text-xl text-muted-foreground">
              Connecting citizens, waste collectors, and recycling centers for a cleaner and greener Aligarh.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg">
                <Link to="/register">Join Today</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/login">Sign In</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features section */}
      <section className="py-16">
        <div className="container px-4 mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <Recycle className="h-12 w-12 text-primary mb-2" />
                <CardTitle>Request Waste Pickups</CardTitle>
                <CardDescription>
                  Schedule pickups for any type of waste directly from your home
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>Our smart system connects you with waste collectors in your area who will pick up your waste on your preferred date and time.</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Map className="h-12 w-12 text-primary mb-2" />
                <CardTitle>Find Recycling Centers</CardTitle>
                <CardDescription>
                  Locate recycling facilities near you in Aligarh
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>Our interactive map shows all recycling facilities in Aligarh with details on what materials they accept and their operating hours.</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Award className="h-12 w-12 text-primary mb-2" />
                <CardTitle>Earn Recycling Points</CardTitle>
                <CardDescription>
                  Get rewarded for your eco-friendly actions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>Earn points every time you recycle or request a waste pickup. Redeem your points for exciting rewards and discounts from local businesses.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA section */}
      <section className="py-16 bg-primary/10">
        <div className="container px-4 mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to make Aligarh cleaner?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Join our community today and be part of the solution for a cleaner, greener Aligarh.
          </p>
          <Button asChild size="lg">
            <Link to="/register">Get Started</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-muted/50">
        <div className="container px-4 mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0">
              <h3 className="text-lg font-bold">Smart Waste Management</h3>
              <p className="text-muted-foreground">Aligarh, Uttar Pradesh, India</p>
            </div>
            <div className="flex gap-8">
              <Link to="/" className="hover:text-primary transition-colors">Home</Link>
              <Link to="/citizen/recycling-centers" className="hover:text-primary transition-colors">Recycling Centers</Link>
              <Link to="/citizen/waste-guide" className="hover:text-primary transition-colors">Waste Guide</Link>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-border text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} Smart Waste Management System. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
