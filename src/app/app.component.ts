import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";

interface StatCard {
  label: string;
  value: string;
  delta?: string;
}

interface StatusSegment {
  label: string;
  value: number;
  color: string;
}

interface MonthlyMetric {
  month: string;
  submitted: number;
  approved: number;
  declined: number;
}

interface VehicleFinance {
  vehicle: string;
  monthlyPayment: string;
  balloonPayment: string;
  totalFinance: string;
}

interface ProductRank {
  vehicle: string;
  volume: number;
}

@Component({
  selector: "app-root",
  imports: [CommonModule],
  templateUrl: "./app.component.html",
  styleUrl: "./app.component.css"
})
export class AppComponent {
  readonly primaryStats: StatCard[] = [
    { label: "Total applications", value: "246", delta: "+18 From last month" },
    { label: "Finance approved", value: "£ 5.82m", delta: "+11.4% From last month" },
    { label: "Re-Payment Amount", value: "£ 1.48m", delta: "+8.2% From last month" }
  ];

  readonly secondaryStats: StatCard[] = [
    { label: "Active in under writer pipeline", value: "38" },
    { label: "Pending invites", value: "18" },
    { label: "Approved", value: "12", delta: "+2.1% From last month" }
  ];

  readonly statuses: StatusSegment[] = [
    { label: "Invite Sent", value: 12, color: "var(--token-color-chart-submitted)" },
    { label: "Underwriter Pipeline", value: 9, color: "var(--token-color-chart-finance)" },
    { label: "Soft Check Failed", value: 6, color: "var(--token-color-chart-soft-check)" },
    { label: "Approved Pipeline", value: 8, color: "var(--token-color-chart-approved)" },
    { label: "Referred to Agent", value: 5, color: "var(--token-color-chart-referred)" },
    { label: "Declined", value: 4, color: "var(--token-color-chart-declined)" },
    { label: "Withdrawn", value: 2, color: "var(--token-color-text-muted)" },
    { label: "Completed", value: 1, color: "var(--token-color-chart-completed)" }
  ];

  readonly monthlyMetrics: MonthlyMetric[] = [
    { month: "Jan", submitted: 68, approved: 28, declined: 10 },
    { month: "Feb", submitted: 60, approved: 26, declined: 14 },
    { month: "Mar", submitted: 82, approved: 34, declined: 11 },
    { month: "Apr", submitted: 72, approved: 30, declined: 14 },
    { month: "May", submitted: 52, approved: 18, declined: 7 },
    { month: "Jun", submitted: 42, approved: 14, declined: 10 },
    { month: "Jul", submitted: 68, approved: 26, declined: 11 },
    { month: "Aug", submitted: 60, approved: 24, declined: 13 },
    { month: "Sep", submitted: 84, approved: 34, declined: 9 },
    { month: "Oct", submitted: 52, approved: 17, declined: 8 },
    { month: "Nov", submitted: 44, approved: 16, declined: 9 },
    { month: "Dec", submitted: 68, approved: 27, declined: 11 }
  ];

  readonly financeRows: VehicleFinance[] = [
    { vehicle: "Tesla Model Y Long Range (AWD)", monthlyPayment: "£665.00", balloonPayment: "£14,149.59", totalFinance: "£62,029.59" },
    { vehicle: "Tesla Model 3 Long Range (AWD)", monthlyPayment: "£640.00", balloonPayment: "£13,638.67", totalFinance: "£59,718.67" },
    { vehicle: "BMW X3 M Sport PHEV", monthlyPayment: "£665.00", balloonPayment: "£13,891.01", totalFinance: "£61,771.01" },
    { vehicle: "MINI Aceman Electric Classic, Level 1", monthlyPayment: "£335.00", balloonPayment: "£7,052.18", totalFinance: "£31,172.18" },
    { vehicle: "MINI Cooper Electric Classic, Level 1", monthlyPayment: "£305.00", balloonPayment: "£7,295.09", totalFinance: "£29,255.09" },
    { vehicle: "MINI Cooper C 5 Door Classic (Petrol)", monthlyPayment: "£280.00", balloonPayment: "£7,107.41", totalFinance: "£27,267.41" },
    { vehicle: "MINI Cooper C 3 Door Classic (Petrol)", monthlyPayment: "£280.00", balloonPayment: "£7,107.41", totalFinance: "£27,267.41" }
  ];

  readonly productRanks: ProductRank[] = [
    { vehicle: "Tesla Model Y Long Range (AWD)", volume: 40 },
    { vehicle: "Tesla Model 3 Long Range (AWD)", volume: 30 },
    { vehicle: "BMW X3 M Sport PHEV", volume: 22 },
    { vehicle: "MINI Aceman Electric Classic, Level 1", volume: 20 },
    { vehicle: "MINI Cooper Electric Classic, Level 1", volume: 15 },
    { vehicle: "MINI Cooper C 5 Door Classic (Petrol)", volume: 10 },
    { vehicle: "MINI Cooper C 3 Door Classic (Petrol)", volume: 10 }
  ];

  statusWidth(value: number): string {
    const total = this.statuses.reduce((sum, item) => sum + item.value, 0);
    return `${(value / total) * 100}%`;
  }
}
