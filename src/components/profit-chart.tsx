'use client';

import { Bar, BarChart, CartesianGrid, Rectangle, ReferenceLine, Tooltip, XAxis, YAxis } from "recharts"
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig
} from "@/components/ui/chart"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Icons } from "./icons";

const chartData = [
    { month: "Jan", profit: 1860, target: 2000 },
    { month: "Feb", profit: 3050, target: 3000 },
    { month: "Mar", profit: 2370, target: 2500 },
    { month: "Apr", profit: 1730, target: 1800 },
    { month: "May", profit: 2090, target: 2200 },
    { month: "Jun", profit: 2140, target: 2300 },
    { month: "Jul", profit: 2840, target: 2800 },
    { month: "Aug", profit: 3140, target: 3000 },
    { month: "Sep", profit: 3340, target: 3200 },
    { month: "Oct", profit: 3840, target: 3500 },
    { month: "Nov", profit: 4140, target: 4000 },
    { month: "Dec", profit: 4540, target: 4200 },
  ]
  
  const chartConfig = {
    profit: {
      label: "Profit",
      color: "hsl(var(--primary))",
    },
    target: {
        label: "Target",
        color: "hsl(var(--accent))"
    }
  } satisfies ChartConfig

export function OwnerDashboard() {
  return (
    <Card className="bg-card/80 backdrop-blur-sm w-full max-w-2xl text-left">
        <CardHeader>
        <CardTitle>Owner's Dashboard</CardTitle>
        <CardDescription>Visualizing your store's success.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
            <h4 className="font-semibold">Profit Growth</h4>
            <Badge variant="secondary" className="bg-accent/20 text-accent">Live</Badge>
        </div>
        <ChartContainer config={chartConfig} className="h-[250px] w-full">
            <BarChart accessibilityLayer data={chartData} margin={{ top: 20, right: 20, bottom: 0, left: -20}}>
            <CartesianGrid vertical={false} />
            <XAxis
                dataKey="month"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
            />
            <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={10}
                tickFormatter={(value) => `$${value / 1000}k`}
            />
            <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="dot" />}
            />
            <ReferenceLine y={3000} label="Average" stroke="hsl(var(--foreground))" strokeDasharray="3 3" />
            <Bar
                dataKey="profit"
                fill="var(--color-profit)"
                radius={4}
                activeBar={
                    <Rectangle
                      fill="hsl(var(--primary) / 0.8)"
                      radius={4}
                    />
                  }
            />
             <Bar dataKey="target" fill="var(--color-target)" radius={4} 
                activeBar={
                    <Rectangle
                      fill="hsl(var(--accent) / 0.8)"
                      radius={4}
                    />
                  }
             />
            </BarChart>
        </ChartContainer>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
            <div className="flex items-center gap-3 p-4 border rounded-lg bg-background/50">
                <Icons.package className="h-8 w-8 text-destructive animate-pulse" />
                <div>
                    <p className="font-semibold">Low Stock Alert</p>
                    <p className="text-sm text-muted-foreground">Cereal - Aisle 4</p>
                </div>
            </div>
            <div className="flex items-center gap-3 p-4 border rounded-lg bg-background/50">
                <Icons.truck className="h-8 w-8 text-accent" />
                <div>
                    <p className="font-semibold">Shipment Arrived</p>
                    <p className="text-sm text-muted-foreground">Fresh Produce</p>
                </div>
            </div>
        </div>
        </CardContent>
    </Card>
  )
}
