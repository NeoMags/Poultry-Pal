

"use client";

import React, { createContext, useContext, useState, ReactNode, useMemo, useEffect } from 'react';
import { format, parseISO, addDays as dateFnsAddDays, isToday, isPast, differenceInDays } from 'date-fns';

// Types
export interface Chick {
  batchId: string;
  breed: string;
  shed: string;
  quantity: number;
  age: number; // Age in days
  supplier: string;
  procurementDate: string;
  type: "Chick" | "Layer" | "Dated";
  createdAt: string;
  referenceNumber?: string;
  notes?: string;
  totalCost?: number;
  costPerChick?: number;
  purchaseOrderId?: string;
}

export interface Shed {
  name: string;
  medsDue: number;
  feedAtLastRefill: number; // in kg
  lastRefillDate: string | null; // ISO string
  productionAlertThreshold?: number;
  feedAlertThreshold?: number;
}

export interface HealthEntry {
    logId: string;
    batchId: string;
    date: string;
    eventType: string;
    details: string;
    quantity: number;
}

export interface LogEntry {
  id: string;
  action: string;
  module: string;
  user: string;
  timestamp: string;
  details?: string;
}

export interface EggCollection {
  logId: string;
  shed: string;
  date: string; // YYYY-MM-DD
  large: number;
  medium: number;
  small: number;
  damaged: number;
  total: number;
  notes?: string;
}

export interface ItemCategory {
    id: string;
    name: string;
    subCategories: string[];
}

export interface ItemMaster {
    id: string;
    name: string;
    category: string;
    subCategory: string;
    type: string;
    unit: string;
    lowStockAlert?: number;
    quantity?: number; // Only used for aggregated views
    initialStock?: number;
}

export interface FeedStock {
  id: string;
  name: string;
  supplier: string;
  stock: number;
  unit: string;
  costPerUnit: number;
  purchaseDate: string; // YYYY-MM-DD
  expiryDate?: string; // YYYY-MM-DD
  lowStockAlert?: number;
  category: 'Feed Ingredient' | 'Health' | 'Packaging' | 'Other';
  purchaseOrderId?: string;
}

export interface PurchaseOrderItem {
    id: string;
    name: string;
    category: 'Feed Ingredient' | 'Health' | 'Chicks' | 'Product' | 'Packaging';
    quantity: number;
    unit: string;
    costPerUnit: number;
    expiryDate?: string;
    // Chick specific
    breed?: string;
    age?: number;
}

export interface PurchaseOrder {
    id: string;
    date: string;
    supplierId: string;
    items: PurchaseOrderItem[];
    totalAmount: number;
    status: 'Pending' | 'Paid';
}


export interface FeedMixIngredient {
    id: string;
    itemMasterId: string; // Changed from feedStockId to itemMasterId
    percentage: number;
}

export interface FeedMix {
    id: string;
    name: string;
    composition: Omit<FeedMixIngredient, 'id'>[];
}

export interface FeedConsumptionLog {
    logId: string;
    shed: string;
    consumptionType: 'FeedMix' | 'Health';
    itemId: string; // feedMixId or feedStockId for direct consumption
    quantity: number;
    unit: string;
    date: string; // YYYY-MM-DD
}

export interface Supplier {
  id: string;
  name: string;
  contact: string;
  phone: string;
  products: string;
  outstandingBalanceAlertThreshold?: number;
}

export interface Staff {
    id: string;
    name: string;
    role: string;
    assignedRoutes: string[];
    status: "Active" | "Inactive";
    aadhar?: string;
    phone?: string;
    address?: string;
    joiningDate?: string;
    licence?: string;
}

export interface Vehicle {
  id: string;
  make: string;
  model: string;
  chassisNumber: string;
  engineNumber: string;
  registrationNumber: string;
  registrationDate: string;
  insuranceDate: string;
  insuranceAlertDays?: number;
  status: 'Available' | 'In Use' | 'Maintenance';
  lastMaintenanceDate?: string;
  maintenanceIntervalDays?: number;
}

export interface FuelLog {
  id: string;
  vehicleId: string;
  date: string;
  liters: number;
  cost: number;
  odometerReading?: number;
}

export interface VehicleMaintenanceLog {
  id: string;
  vehicleId: string;
  date: string;
  description: string;
  cost: number;
}


export interface Customer {
  id: string;
  name: string;
  type: string;
  contact: string;
  phone: string;
  email: string;
  address: string;
  route: string;
  emptyTraysHeld: number;
}

export interface Dispatch {
  invoiceId: string;
  customerId: string;
  customerName: string;
  route: string;
  driver: string; // Note: Driver is on the route, added here for denormalization
  date: string; // YYYY-MM-DD
  status: 'Pending' | 'In Transit' | 'Delivered';
  dispatchType: 'Eggs' | 'Chicks';
  totalAmount: number;
  // Egg specific
  eggs?: number;
  trays?: number;
  pricePerEgg?: number;
  // Chick specific
  chickQuantity?: number;
  chickType?: 'Layer' | 'Dated';
  chickShed?: string;
  pricePerChick?: number;
}


export interface Company {
    id: string;
    name: string;
    logoUrl?: string;
}

export interface InventoryData {
    readyStock: number;
    emptyTrays: number;
    brokenStock: number;
    purchasedEggs: number;
}

// Accounting Types
export interface Expense {
    id: string;
    date: string;
    category: string;
    amount: number;
    description: string;
}

export interface BankAccount {
  id: string;
  accountName: string;
  bankName: string;
  accountNumber: string;
  initialBalance: number;
  accountType?: string;
  ifscCode?: string;
  upiAddress?: string;
  qrCodeUrl?: string;
}

export interface Payment {
    id: string;
    date: string;
    amount: number;
    method: string;
    customerId?: string; // Inward
    supplierId?: string; // Outward
    description?: string; // e.g. Invoice#
    bankAccountId?: string;
    bankDetails?: string;
    chequeNumber?: string;
    utrNumber?: string;
    purchaseOrderId?: string;
    creditNoteId?: string;
}

export type EntityType = 'Customer' | 'Supplier' | 'Staff';

export interface CreditNote {
    id: string;
    date: string;
    entityId: string;
    entityType: EntityType;
    amount: number; // Represents money you owe, so it's a liability
    reason: string;
    reference?: string;
}

export interface DebitNote {
    id: string;
    date: string;
    entityId: string;
    entityType: EntityType;
    amount: number; // Represents money owed to you, so it's an asset
    reason: string;
    reference?: string;
}


// Task Manager Types
export interface RecurrenceRule {
    type: 'daily'; // weekly, monthly could be added later
    interval: number; // e.g., 2 for every 2 days
}
export interface Task {
  id: string;
  projectId: string;
  title: string;
  assignedTo: string; // Staff ID
  status: 'To Do' | 'In Progress' | 'Done';
  completionNotes?: string;
  reminderDate?: string; // ISO string for one-time or start date for recurrence
  recurrence?: RecurrenceRule;
  shedId?: string; // Link task to a specific shed
}

export interface Project {
  id: string;
  title: string;
}

// New Feed Settings Type
export interface FeedSettings {
  hoursPerKgPerChick: number;
}

// New Attendance Type
export interface AttendanceLog {
  id: string;
  staffId: string;
  date: string; // YYYY-MM-DD
  status: 'Present' | 'Absent' | 'Leave';
}

// New Leave Request Type
export interface LeaveRequest {
  id: string;
  staffId: string;
  requestDate: string; // ISO String
  leaveDate: string; // YYYY-MM-DD
  reason: string;
  status: 'Pending' | 'Approved' | 'Denied';
}

export interface AlertConfig {
    id: 'lowStock' | 'insuranceRenewal' | 'maintenanceDue' | 'lowProduction' | 'paymentOverdue' | string;
    name: string;
    description: string;
    enabled: boolean;
    // For more complex alerts in the future
    threshold?: number;
    // conditions?: any;
}

export interface SupplierReturn {
    dispatchId: string;
    undeliveredEggs: number;
    damagedEggs: number;
    collectedTrays: number;
    remarks?: string;
}


type NewChickBatchData = Omit<Chick, 'createdAt' | 'batchId' | 'procurementDate'>;

type NewPurchaseOrderData = {
    supplierId: string;
    items: Omit<PurchaseOrderItem, 'id'>[];
};


interface FarmContextType {
  chickData: Chick[];
  shedData: Shed[];
  healthData: HealthEntry[];
  logs: LogEntry[];
  eggCollectionData: EggCollection[];
  itemMaster: ItemMaster[];
  feedStockData: FeedStock[];
  purchaseOrders: PurchaseOrder[];
  feedMixes: FeedMix[];
  feedConsumptionData: FeedConsumptionLog[];
  suppliersData: Supplier[];
  staffData: Staff[];
  vehicleData: Vehicle[];
  fuelLogData: FuelLog[];
  vehicleMaintenanceLogData: VehicleMaintenanceLog[];
  customerData: Customer[];
  dispatchData: Dispatch[];
  companies: Company[];
  inventoryData: InventoryData;
  routeNames: string[];
  projects: Project[];
  tasks: Task[];
  activeCompany: Company | null;
  bankAccounts: BankAccount[];
  expenseData: Expense[];
  paymentData: Payment[];
  creditNoteData: CreditNote[];
  debitNoteData: DebitNote[];
  itemCategories: ItemCategory[];
  itemTypes: string[];
  feedSettings: FeedSettings;
  attendanceData: AttendanceLog[];
  leaveRequests: LeaveRequest[];
  alertConfigs: AlertConfig[];
  addChickBatch: (batch: NewChickBatchData) => { success: boolean, message: string };
  directAddChickBatch: (batch: Omit<Chick, 'createdAt' | 'batchId' | 'procurementDate'> & { supplierId: string, costPerChick: number, totalAmount: number }) => { success: boolean, message: string };
  transferChickBatch: (
    sourceBatchId: string,
    transferQty: number,
    newType: "Chick" | "Layer" | "Dated" | "",
    newShed: string
  ) => { success: boolean, message: string };
  addShed: (shedName: string) => { success: boolean, message: string };
  updateShed: (shedName: string, updates: Partial<Omit<Shed, 'name'>>) => { success: boolean, message: string };
  deleteShed: (shedName: string) => void;
  addLogEntry: (module: string, action: string, details?: string) => void;
  logEggCollection: (log: { shed: string, large: number, medium: number, small: number, damaged: number, notes?: string }) => { success: boolean, message: string };
  addHealthLog: (log: Omit<HealthEntry, 'logId' | 'date'>) => { success: boolean, message: string };
  getShedsWithDetails: () => (Shed & { henCount: number, chickCount: number, layerCount: number, datedCount: number, eggProduction: number, productionPercentage: number, consumptionRateKgPerHour: number, remainingKg: number, remainingHours: number })[];
  addItemToMaster: (item: Omit<ItemMaster, 'id'>) => { success: boolean; message: string; };
  updateItemMaster: (itemId: string, updates: Partial<ItemMaster>) => { success: boolean; message: string; };
  deleteItemMaster: (itemId: string) => { success: boolean; message: string; };
  addItemCategory: (categoryName: string) => { success: boolean; message: string; };
  deleteItemCategory: (categoryId: string) => { success: boolean; message: string; };
  addSubCategory: (categoryId: string, subCategoryName: string) => { success: boolean; message: string; };
  deleteSubCategory: (categoryId: string, subCategoryName: string) => { success: boolean; message: string; };
  addItemType: (typeName: string) => { success: boolean; message: string; };
  deleteItemType: (typeName: string) => { success: boolean; message: string; };
  addPurchaseOrder: (poData: NewPurchaseOrderData) => { success: boolean, message: string, poId?: string };
  logPaymentForPO: (poId: string, paymentDetails: Omit<Payment, 'id' | 'date' | 'supplierId' | 'amount' | 'description' | 'purchaseOrderId'>) => { success: boolean, message: string };
  addFeedMix: (feedMix: Omit<FeedMix, 'id'> & { id?: string }) => { success: boolean, message: string };
  updateFeedMix: (mixId: string, updatedData: Omit<FeedMix, 'id'>) => { success: boolean, message: string };
  deleteFeedMix: (mixId: string) => { success: boolean, message: string };
  logFeedConsumption: (log: Omit<FeedConsumptionLog, 'logId' | 'date'>) => { success: boolean, message: string };
  addSupplier: (supplier: Omit<Supplier, 'id'>) => { success: boolean, message: string };
  updateSupplier: (supplierId: string, updates: Partial<Omit<Supplier, 'id'>>) => { success: boolean; message: string; };
  deleteSupplier: (supplierId: string) => { success: boolean; message: string };
  addStaff: (staff: Omit<Staff, 'id'>) => { success: boolean, message: string };
  updateStaff: (staff: Staff) => { success: boolean; message: string };
  deleteStaff: (staffId: string) => { success: boolean; message: string };
  setStaffStatus: (staffId: string, status: 'Active' | 'Inactive') => { success: boolean; message: string; };
  logAttendance: (dailyRecords: { staffId: string; status: 'Present' | 'Absent' | 'Leave'; date?: string }[]) => { success: boolean; message: string; };
  requestLeave: (staffId: string, leaveDate: string, reason: string) => { success: boolean; message: string; };
  approveLeave: (leaveRequestId: string) => { success: boolean; message: string; };
  denyLeave: (leaveRequestId: string) => { success: boolean; message: string; };
  addVehicle: (vehicle: Omit<Vehicle, 'id'>) => { success: boolean, message: string };
  addFuelLog: (log: Omit<FuelLog, 'id'>) => { success: boolean; message: string; };
  addVehicleMaintenanceLog: (log: Omit<VehicleMaintenanceLog, 'id'>) => { success: boolean; message: string; };
  addCustomer: (customer: Omit<Customer, 'id' | 'emptyTraysHeld'>) => { success: boolean, message: string };
  addDispatch: (dispatch: Omit<Dispatch, 'invoiceId' | 'date' | 'status' | 'driver'>) => { success: boolean, message: string };
  updateDispatchStatus: (dispatchId: string, status: Dispatch['status']) => { success: boolean, message: string };
  logTrayCollection: (customerId: string, traysCollected: number) => { success: boolean; message: string; };
  processReturn: (returnData: SupplierReturn) => { success: boolean, message: string };
  addCompany: (name: string, logoUrl?: string) => { success: boolean; message: string; };
  updateCompany: (companyId: string, updates: Partial<Omit<Company, 'id'>>) => { success: boolean; message: string; };
  switchCompany: (companyId: string) => void;
  getBackupData: () => string;
  restoreBackupData: (jsonData: string, newCompanyName: string) => { success: boolean; message: string; };
  addRouteName: (routeName: string) => { success: boolean; message: string; };
  addBankAccount: (account: Omit<BankAccount, 'id'>) => { success: boolean; message: string; };
  addExpense: (expense: Omit<Expense, 'id' | 'date'>) => { success: boolean; message: string; };
  addPayment: (payment: Omit<Payment, 'id' | 'date'> & { date?: string }) => { success: boolean, message: string; };
  addCreditNote: (note: Omit<CreditNote, 'id' | 'date'>) => { success: boolean; message: string; };
  addDebitNote: (note: Omit<DebitNote, 'id' | 'date'>) => { success: boolean; message: string; };
  addProject: (title: string) => { success: boolean; message: string; };
  addTask: (taskData: Omit<Task, 'id' | 'status'>) => { success: boolean; message: string; };
  updateTask: (taskId: string, updates: Partial<Omit<Task, 'id' | 'projectId' | 'title'>>) => { success: boolean; message: string; };
  deleteTask: (taskId: string) => { success: boolean; message: string; };
  updateFeedSettings: (settings: Partial<FeedSettings>) => void;
  updateAlertConfig: (alertId: string, updates: Partial<AlertConfig>) => { success: boolean; message: string; };
  allSheds: string[];
  uniqueSuppliers: string[];
  todaysTotalEggCollection: number;
  isLoading: boolean;
  activeCompanyName: string;
}

const FarmContext = createContext<FarmContextType | undefined>(undefined);

const DATA_KEYS = {
    chickData: 'poultryPalChickData',
    shedData: 'poultryPalShedData',
    logData: 'poultryPalLogData',
    healthData: 'poultryPalHealthData',
    eggData: 'poultryPalEggData',
    itemMaster: 'poultryPalItemMaster',
    itemCategories: 'poultryPalItemCategories',
    itemTypes: 'poultryPalItemTypes',
    feedStockData: 'poultryPalFeedStockData',
    purchaseOrders: 'poultryPalPurchaseOrders',
    feedMixData: 'poultryPalFeedMixData',
    feedConsumptionData: 'poultryPalFeedConsumptionData',
    supplierData: 'poultryPalSupplierData',
    staffData: 'poultryPalStaffData',
    vehicleData: 'poultryPalVehicleData',
    fuelLogData: 'poultryPalFuelLogData',
    vehicleMaintenanceLogData: 'poultryPalVehicleMaintenanceLogData',
    customerData: 'poultryPalCustomerData',
    dispatchData: 'poultryPalDispatchData',
    routeNames: 'poultryPalRouteNames',
    inventoryData: 'poultryPalInventoryData',
    bankAccountData: 'poultryPalBankAccountData',
    expenseData: 'poultryPalExpenseData',
    paymentData: 'poultryPalPaymentData',
    creditNoteData: 'poultryPalCreditNoteData',
    debitNoteData: 'poultryPalDebitNoteData',
    projectData: 'poultryPalProjectData',
    taskData: 'poultryPalTaskData',
    feedSettings: 'poultryPalFeedSettings',
    attendanceData: 'poultryPalAttendanceData',
    leaveRequestData: 'poultryPalLeaveRequestData',
    alertConfigs: 'poultryPalAlertConfigs',
};
const COMPANIES_KEY = 'poultryPalCompanies';
const ACTIVE_COMPANY_KEY = 'poultryPalActiveCompany';

const SYSTEM_ITEMS: ItemMaster[] = [
    { id: 'SYS_EGGS', name: 'Eggs', category: 'Product', subCategory: 'Sellable', type: 'Product', unit: 'pcs', lowStockAlert: 1000 },
    { id: 'SYS_TRAYS', name: 'Trays', category: 'Packaging', subCategory: 'Consumable', type: 'Asset', unit: 'pcs', lowStockAlert: 100 },
];

const DEFAULT_CATEGORIES: ItemCategory[] = [
    { id: 'CAT-1', name: 'Feed Ingredient', subCategories: ['Grain', 'Protein', 'Additive'] },
    { id: 'CAT-2', name: 'Health', subCategories: ['Vaccine', 'Medication', 'Supplement'] },
    { id: 'CAT-3', name: 'Product', subCategories: ['Sellable'] },
    { id: 'CAT-4', name: 'Chicks', subCategories: ['Broiler', 'Layer'] },
    { id: 'CAT-5', name: 'Packaging', subCategories: ['Consumable'] },
    { id: 'CAT-6', name: 'Other', subCategories: ['General'] },
];

const DEFAULT_ALERTS: AlertConfig[] = [
    { id: 'lowStock', name: 'Low Stock Warning', description: 'Get notified when any inventory item falls below its set threshold.', enabled: true },
    { id: 'insuranceRenewal', name: 'Insurance Renewal Reminder', description: 'Receive alerts for vehicle insurance renewals that are due soon.', enabled: true },
    { id: 'maintenanceDue', name: 'Vehicle Maintenance Due', description: 'Get reminders for upcoming scheduled vehicle maintenance.', enabled: true },
    { id: 'lowProduction', name: 'Low Production Alert', description: 'Flag sheds where egg production percentage drops below a specified target.', enabled: false, threshold: 50 },
    { id: 'paymentOverdue', name: 'Payment Overdue', description: 'Get alerts when customer payments are pending for more than X days.', enabled: false, threshold: 15 },
];

const LOG_LIMIT = 500;

// Helper function to check if a value is a record (object)
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

// Normalization function for Item Categories
function normalizeItemCategories(value: unknown): ItemCategory[] {
    let list: unknown[];
    if (Array.isArray(value)) {
        list = value;
    } else if (isRecord(value) && Array.isArray(value.itemCategories)) {
        // Handle cases where it might be nested, e.g., { itemCategories: [...] }
        list = value.itemCategories;
    } else {
        return []; // Return empty array if the structure is completely unexpected
    }

    return list.map((item, index) => {
        if (isRecord(item) && 'name' in item && typeof item.name === 'string') {
            // It's already in the correct object format
            return {
                id: (typeof item.id === 'string' ? item.id : `CAT-${Date.now()}-${index}`),
                name: item.name,
                subCategories: Array.isArray(item.subCategories) ? item.subCategories : [],
            };
        }
        if (typeof item === 'string') {
            // It's a string, so we coerce it into the object format
            return {
                id: `CAT-string-${Date.now()}-${index}`,
                name: item,
                subCategories: [],
            };
        }
        // If it's something else, return a default-shaped object to avoid crashes
        return {
            id: `CAT-invalid-${Date.now()}-${index}`,
            name: 'Invalid Category',
            subCategories: [],
        };
    });
}


// Initial Data for a new company
const getInitialData = (companyName: string) => ({
    chickData: [],
    shedData: [],
    healthData: [],
    logs: [{ id: 'log-1', action: "Company Created", module: "System", user: "system", timestamp: new Date().toISOString(), details: `Company '${companyName}' initialized.` }],
    eggCollectionData: [],
    itemMaster: SYSTEM_ITEMS,
    itemCategories: DEFAULT_CATEGORIES,
    itemTypes: ["Raw Material", "Consumable", "Asset", "Product"],
    feedStockData: [],
    purchaseOrders: [],
    feedMixes: [],
    feedConsumptionData: [],
    suppliersData: [],
    staffData: [],
    vehicleData: [],
    fuelLogData: [],
    vehicleMaintenanceLogData: [],
    customerData: [],
    dispatchData: [],
    routeNames: [],
    inventoryData: { readyStock: 0, emptyTrays: 1000, purchasedEggs: 0, brokenStock: 0 },
    bankAccounts: [],
    expenseData: [],
    paymentData: [],
    creditNoteData: [],
    debitNoteData: [],
    projects: [],
    tasks: [],
    feedSettings: { hoursPerKgPerChick: 96 }, // Default: 4 days for 1 chick to eat 1kg
    attendanceData: [],
    leaveRequests: [],
    alertConfigs: DEFAULT_ALERTS,
});

export const FarmProvider = ({ children }: { children: ReactNode }) => {
  const [chickData, setChickData] = useState<Chick[]>([]);
  const [shedData, setShedData] = useState<Shed[]>([]);
  const [healthData, setHealthData] = useState<HealthEntry[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [eggCollectionData, setEggCollectionData] = useState<EggCollection[]>([]);
  const [itemMaster, setItemMaster] = useState<ItemMaster[]>([]);
  const [itemCategories, setItemCategories] = useState<ItemCategory[]>([]);
  const [itemTypes, setItemTypes] = useState<string[]>([]);
  const [feedStockData, setFeedStockData] = useState<FeedStock[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [feedMixes, setFeedMixes] = useState<FeedMix[]>([]);
  const [feedConsumptionData, setFeedConsumptionData] = useState<FeedConsumptionLog[]>([]);
  const [suppliersData, setSuppliersData] = useState<Supplier[]>([]);
  const [staffData, setStaffData] = useState<Staff[]>([]);
  const [vehicleData, setVehicleData] = useState<Vehicle[]>([]);
  const [fuelLogData, setFuelLogData] = useState<FuelLog[]>([]);
  const [vehicleMaintenanceLogData, setVehicleMaintenanceLogData] = useState<VehicleMaintenanceLog[]>([]);
  const [customerData, setCustomerData] = useState<Customer[]>([]);
  const [dispatchData, setDispatchData] = useState<Dispatch[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [routeNames, setRouteNames] = useState<string[]>([]);
  const [inventoryData, setInventoryData] = useState<InventoryData>({ readyStock: 0, emptyTrays: 0, brokenStock: 0, purchasedEggs: 0 });
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [expenseData, setExpenseData] = useState<Expense[]>([]);
  const [paymentData, setPaymentData] = useState<Payment[]>([]);
  const [creditNoteData, setCreditNoteData] = useState<CreditNote[]>([]);
  const [debitNoteData, setDebitNoteData] = useState<DebitNote[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [feedSettings, setFeedSettings] = useState<FeedSettings>({ hoursPerKgPerChick: 96 });
  const [attendanceData, setAttendanceData] = useState<AttendanceLog[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [alertConfigs, setAlertConfigs] = useState<AlertConfig[]>([]);
  const [activeCompanyId, setActiveCompanyId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load and manage company data
  useEffect(() => {
    const parseWithFallback = (data: string | null | undefined, fallback: any, normalizer?: (value: any) => any) => {
      if (data && data !== "undefined") {
        try {
          const parsed = JSON.parse(data);
          return normalizer ? normalizer(parsed) : parsed;
        } catch (e) {
          console.error("Failed to parse JSON from localStorage, using fallback", e);
          return fallback;
        }
      }
      return fallback;
    };
    
    try {
      // ONE-TIME MIGRATION: Check for old, un-namespaced data
      const oldDataExists = localStorage.getItem('poultryPalChickData');
      const storedCompanies = localStorage.getItem(COMPANIES_KEY);

      if (oldDataExists && !storedCompanies) {
        const newCompanyId = `company_${"\'\'\'"}${Date.now()}${"\'\'\'"}`;
        const newCompanies = [{ id: newCompanyId, name: 'Default Company' }];
        
        Object.entries(DATA_KEYS).forEach(([dataKey, storageKey]) => {
            const oldData = localStorage.getItem(storageKey);
            if (oldData) {
                localStorage.setItem(`${newCompanyId}_${storageKey}`, oldData);
                localStorage.removeItem(storageKey);
            }
        });

        localStorage.setItem(COMPANIES_KEY, JSON.stringify(newCompanies));
        localStorage.setItem(ACTIVE_COMPANY_KEY, newCompanyId);
        window.location.reload(); // Force a reload to apply new structure
        return;
      }

      const parsedCompanies = storedCompanies ? parseWithFallback(storedCompanies, []) : [];
      setCompanies(parsedCompanies);

      let currentCompanyId = localStorage.getItem(ACTIVE_COMPANY_KEY);
      if (!currentCompanyId && parsedCompanies.length > 0) {
        const firstCompanyId: string = parsedCompanies[0].id;
        currentCompanyId = firstCompanyId;
        localStorage.setItem(ACTIVE_COMPANY_KEY, firstCompanyId);
      }
      setActiveCompanyId(currentCompanyId);

      if (currentCompanyId) {
        const companyName = parsedCompanies.find((c:Company) => c.id === currentCompanyId)?.name || 'Untitled';
        const initial = getInitialData(companyName);
        
        setChickData(parseWithFallback(localStorage.getItem(`${currentCompanyId}_${DATA_KEYS.chickData}`), initial.chickData));
        setShedData(parseWithFallback(localStorage.getItem(`${currentCompanyId}_${DATA_KEYS.shedData}`), initial.shedData));
        setHealthData(parseWithFallback(localStorage.getItem(`${currentCompanyId}_${DATA_KEYS.healthData}`), initial.healthData));
        setLogs(parseWithFallback(localStorage.getItem(`${currentCompanyId}_${DATA_KEYS.logData}`), initial.logs));
        setEggCollectionData(parseWithFallback(localStorage.getItem(`${currentCompanyId}_${DATA_KEYS.eggData}`), initial.eggCollectionData));
        const storedMaster = parseWithFallback(localStorage.getItem(`${currentCompanyId}_${DATA_KEYS.itemMaster}`), initial.itemMaster);
        const systemItemIds = SYSTEM_ITEMS.map(i => i.id);
        const userItems = storedMaster.filter((i: ItemMaster) => !systemItemIds.includes(i.id));
        const mergedMaster = [...SYSTEM_ITEMS.map(si => storedMaster.find((i: ItemMaster) => i.id === si.id) || si), ...userItems];
        setItemMaster(mergedMaster);
        setItemCategories(parseWithFallback(localStorage.getItem(`${currentCompanyId}_${DATA_KEYS.itemCategories}`), initial.itemCategories, normalizeItemCategories));
        setItemTypes(parseWithFallback(localStorage.getItem(`${currentCompanyId}_${DATA_KEYS.itemTypes}`), initial.itemTypes));
        setFeedStockData(parseWithFallback(localStorage.getItem(`${currentCompanyId}_${DATA_KEYS.feedStockData}`), initial.feedStockData));
        setPurchaseOrders(parseWithFallback(localStorage.getItem(`${currentCompanyId}_${DATA_KEYS.purchaseOrders}`), initial.purchaseOrders));
        setFeedMixes(parseWithFallback(localStorage.getItem(`${currentCompanyId}_${DATA_KEYS.feedMixData}`), initial.feedMixes));
        setFeedConsumptionData(parseWithFallback(localStorage.getItem(`${currentCompanyId}_${DATA_KEYS.feedConsumptionData}`), initial.feedConsumptionData));
        setSuppliersData(parseWithFallback(localStorage.getItem(`${currentCompanyId}_${DATA_KEYS.supplierData}`), initial.suppliersData));
        setStaffData(parseWithFallback(localStorage.getItem(`${currentCompanyId}_${DATA_KEYS.staffData}`), initial.staffData));
        setVehicleData(parseWithFallback(localStorage.getItem(`${currentCompanyId}_${DATA_KEYS.vehicleData}`), initial.vehicleData));
        setFuelLogData(parseWithFallback(localStorage.getItem(`${currentCompanyId}_${DATA_KEYS.fuelLogData}`), initial.fuelLogData));
        setVehicleMaintenanceLogData(parseWithFallback(localStorage.getItem(`${currentCompanyId}_${DATA_KEYS.vehicleMaintenanceLogData}`), initial.vehicleMaintenanceLogData));
        setCustomerData(parseWithFallback(localStorage.getItem(`${currentCompanyId}_${DATA_KEYS.customerData}`), initial.customerData));
        setDispatchData(parseWithFallback(localStorage.getItem(`${currentCompanyId}_${DATA_KEYS.dispatchData}`), initial.dispatchData));
        setRouteNames(parseWithFallback(localStorage.getItem(`${currentCompanyId}_${DATA_KEYS.routeNames}`), initial.routeNames));
        setInventoryData(parseWithFallback(localStorage.getItem(`${currentCompanyId}_${DATA_KEYS.inventoryData}`), initial.inventoryData));
        setBankAccounts(parseWithFallback(localStorage.getItem(`${currentCompanyId}_${DATA_KEYS.bankAccountData}`), initial.bankAccounts));
        setExpenseData(parseWithFallback(localStorage.getItem(`${currentCompanyId}_${DATA_KEYS.expenseData}`), initial.expenseData));
        setPaymentData(parseWithFallback(localStorage.getItem(`${currentCompanyId}_${DATA_KEYS.paymentData}`), initial.paymentData));
        setCreditNoteData(parseWithFallback(localStorage.getItem(`${currentCompanyId}_${DATA_KEYS.creditNoteData}`), initial.creditNoteData));
        setDebitNoteData(parseWithFallback(localStorage.getItem(`${currentCompanyId}_${DATA_KEYS.debitNoteData}`), initial.debitNoteData));
        setProjects(parseWithFallback(localStorage.getItem(`${currentCompanyId}_${DATA_KEYS.projectData}`), initial.projects));
        setTasks(parseWithFallback(localStorage.getItem(`${currentCompanyId}_${DATA_KEYS.taskData}`), initial.tasks));
        setFeedSettings(parseWithFallback(localStorage.getItem(`${currentCompanyId}_${DATA_KEYS.feedSettings}`), initial.feedSettings));
        setAttendanceData(parseWithFallback(localStorage.getItem(`${currentCompanyId}_${DATA_KEYS.attendanceData}`), initial.attendanceData));
        setLeaveRequests(parseWithFallback(localStorage.getItem(`${currentCompanyId}_${DATA_KEYS.leaveRequestData}`), []));
        setAlertConfigs(parseWithFallback(localStorage.getItem(`${currentCompanyId}_${DATA_KEYS.alertConfigs}`), initial.alertConfigs));

      }
    } catch (error) {
      console.error("Error initializing farm data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [activeCompanyId]);

  // Save data to localStorage whenever it changes
  useEffect(() => { if (!isLoading && activeCompanyId) { localStorage.setItem(COMPANIES_KEY, JSON.stringify(companies)); }}, [companies, isLoading, activeCompanyId]);
  useEffect(() => { if (!isLoading && activeCompanyId) { localStorage.setItem(`${activeCompanyId}_${DATA_KEYS.chickData}`, JSON.stringify(chickData)); }}, [chickData, isLoading, activeCompanyId]);
  useEffect(() => { if (!isLoading && activeCompanyId) { localStorage.setItem(`${activeCompanyId}_${DATA_KEYS.shedData}`, JSON.stringify(shedData)); }}, [shedData, isLoading, activeCompanyId]);
  useEffect(() => { if (!isLoading && activeCompanyId) { localStorage.setItem(`${activeCompanyId}_${DATA_KEYS.healthData}`, JSON.stringify(healthData)); }}, [healthData, isLoading, activeCompanyId]);
  useEffect(() => { if (!isLoading && activeCompanyId) { localStorage.setItem(`${activeCompanyId}_${DATA_KEYS.eggData}`, JSON.stringify(eggCollectionData)); }}, [eggCollectionData, isLoading, activeCompanyId]);
  useEffect(() => { if (!isLoading && activeCompanyId) { localStorage.setItem(`${activeCompanyId}_${DATA_KEYS.itemMaster}`, JSON.stringify(itemMaster)); }}, [itemMaster, isLoading, activeCompanyId]);
  useEffect(() => { if (!isLoading && activeCompanyId) { localStorage.setItem(`${activeCompanyId}_${DATA_KEYS.itemCategories}`, JSON.stringify(itemCategories)); }}, [itemCategories, isLoading, activeCompanyId]);
  useEffect(() => { if (!isLoading && activeCompanyId) { localStorage.setItem(`${activeCompanyId}_${DATA_KEYS.itemTypes}`, JSON.stringify(itemTypes)); }}, [itemTypes, isLoading, activeCompanyId]);
  useEffect(() => { if (!isLoading && activeCompanyId) { localStorage.setItem(`${activeCompanyId}_${DATA_KEYS.logData}`, JSON.stringify(logs)); }}, [logs, isLoading, activeCompanyId]);
  useEffect(() => { if (!isLoading && activeCompanyId) { localStorage.setItem(`${activeCompanyId}_${DATA_KEYS.feedStockData}`, JSON.stringify(feedStockData)); }}, [feedStockData, isLoading, activeCompanyId]);
  useEffect(() => { if (!isLoading && activeCompanyId) { localStorage.setItem(`${activeCompanyId}_${DATA_KEYS.purchaseOrders}`, JSON.stringify(purchaseOrders)); }}, [purchaseOrders, isLoading, activeCompanyId]);
  useEffect(() => { if (!isLoading && activeCompanyId) { localStorage.setItem(`${activeCompanyId}_${DATA_KEYS.feedMixData}`, JSON.stringify(feedMixes)); }}, [feedMixes, isLoading, activeCompanyId]);
  useEffect(() => { if (!isLoading && activeCompanyId) { localStorage.setItem(`${activeCompanyId}_${DATA_KEYS.feedConsumptionData}`, JSON.stringify(feedConsumptionData)); }}, [feedConsumptionData, isLoading, activeCompanyId]);
  useEffect(() => { if (!isLoading && activeCompanyId) { localStorage.setItem(`${activeCompanyId}_${DATA_KEYS.supplierData}`, JSON.stringify(suppliersData)); }}, [suppliersData, isLoading, activeCompanyId]);
  useEffect(() => { if (!isLoading && activeCompanyId) { localStorage.setItem(`${activeCompanyId}_${DATA_KEYS.staffData}`, JSON.stringify(staffData)); }}, [staffData, isLoading, activeCompanyId]);
  useEffect(() => { if (!isLoading && activeCompanyId) { localStorage.setItem(`${activeCompanyId}_${DATA_KEYS.vehicleData}`, JSON.stringify(vehicleData)); }}, [vehicleData, isLoading, activeCompanyId]);
  useEffect(() => { if (!isLoading && activeCompanyId) { localStorage.setItem(`${activeCompanyId}_${DATA_KEYS.fuelLogData}`, JSON.stringify(fuelLogData)); }}, [fuelLogData, isLoading, activeCompanyId]);
  useEffect(() => { if (!isLoading && activeCompanyId) { localStorage.setItem(`${activeCompanyId}_${DATA_KEYS.vehicleMaintenanceLogData}`, JSON.stringify(vehicleMaintenanceLogData)); }}, [vehicleMaintenanceLogData, isLoading, activeCompanyId]);
  useEffect(() => { if (!isLoading && activeCompanyId) { localStorage.setItem(`${activeCompanyId}_${DATA_KEYS.customerData}`, JSON.stringify(customerData)); }}, [customerData, isLoading, activeCompanyId]);
  useEffect(() => { if (!isLoading && activeCompanyId) { localStorage.setItem(`${activeCompanyId}_${DATA_KEYS.dispatchData}`, JSON.stringify(dispatchData)); }}, [dispatchData, isLoading, activeCompanyId]);
  useEffect(() => { if (!isLoading && activeCompanyId) { localStorage.setItem(`${activeCompanyId}_${DATA_KEYS.routeNames}`, JSON.stringify(routeNames)); }}, [routeNames, isLoading, activeCompanyId]);
  useEffect(() => { if (!isLoading && activeCompanyId) { localStorage.setItem(`${activeCompanyId}_${DATA_KEYS.bankAccountData}`, JSON.stringify(bankAccounts)); }}, [bankAccounts, isLoading, activeCompanyId]);
  useEffect(() => { if (!isLoading && activeCompanyId) { localStorage.setItem(`${activeCompanyId}_${DATA_KEYS.expenseData}`, JSON.stringify(expenseData)); }}, [expenseData, isLoading, activeCompanyId]);
  useEffect(() => { if (!isLoading && activeCompanyId) { localStorage.setItem(`${activeCompanyId}_${DATA_KEYS.paymentData}`, JSON.stringify(paymentData)); }}, [paymentData, isLoading, activeCompanyId]);
  useEffect(() => { if (!isLoading && activeCompanyId) { localStorage.setItem(`${activeCompanyId}_${DATA_KEYS.creditNoteData}`, JSON.stringify(creditNoteData)); }}, [creditNoteData, isLoading, activeCompanyId]);
  useEffect(() => { if (!isLoading && activeCompanyId) { localStorage.setItem(`${activeCompanyId}_${DATA_KEYS.debitNoteData}`, JSON.stringify(debitNoteData)); }}, [debitNoteData, isLoading, activeCompanyId]);
  useEffect(() => { if (!isLoading && activeCompanyId) { localStorage.setItem(`${activeCompanyId}_${DATA_KEYS.projectData}`, JSON.stringify(projects)); }}, [projects, isLoading, activeCompanyId]);
  useEffect(() => { if (!isLoading && activeCompanyId) { localStorage.setItem(`${activeCompanyId}_${DATA_KEYS.taskData}`, JSON.stringify(tasks)); }}, [tasks, isLoading, activeCompanyId]);
  useEffect(() => { if (!isLoading && activeCompanyId) { localStorage.setItem(`${activeCompanyId}_${DATA_KEYS.feedSettings}`, JSON.stringify(feedSettings)); }}, [feedSettings, isLoading, activeCompanyId]);
  useEffect(() => { if (!isLoading && activeCompanyId) { localStorage.setItem(`${activeCompanyId}_${DATA_KEYS.attendanceData}`, JSON.stringify(attendanceData)); }}, [attendanceData, isLoading, activeCompanyId]);
  useEffect(() => { if (!isLoading && activeCompanyId) { localStorage.setItem(`${activeCompanyId}_${DATA_KEYS.leaveRequestData}`, JSON.stringify(leaveRequests)); }}, [leaveRequests, isLoading, activeCompanyId]);
  useEffect(() => { if (!isLoading && activeCompanyId) { localStorage.setItem(`${activeCompanyId}_${DATA_KEYS.alertConfigs}`, JSON.stringify(alertConfigs)); }}, [alertConfigs, isLoading, activeCompanyId]);

  // Recalculate inventory whenever dependencies change
  useEffect(() => {
    if (isLoading) return;

    const totalCollected = eggCollectionData.reduce((sum, log) => sum + log.total, 0);
    const totalDispatched = dispatchData.reduce((sum, d) => {
        const itemNameLower = d.dispatchType.toLowerCase();
        if (itemNameLower === 'egg' || itemNameLower === 'eggs') {
            return sum + (d.eggs || 0);
        }
        return sum;
    }, 0);
    const totalDamagedFromCollection = eggCollectionData.reduce((sum, log) => sum + log.damaged, 0);
    const totalPurchased = inventoryData.purchasedEggs || 0;
    
    // Total in stock should be what was collected plus what was purchased, minus what was sent out
    const readyStock = totalCollected + totalPurchased - totalDispatched;
    
    setInventoryData(prev => ({
        ...prev,
        readyStock: readyStock,
        brokenStock: totalDamagedFromCollection,
    }));

  }, [eggCollectionData, dispatchData, isLoading, inventoryData.purchasedEggs, creditNoteData]);
  
  useEffect(() => { if (!isLoading && activeCompanyId) { localStorage.setItem(`${activeCompanyId}_${DATA_KEYS.inventoryData}`, JSON.stringify(inventoryData)); }}, [inventoryData, isLoading, activeCompanyId]);



  const addLogEntry = (module: string, action: string, details?: string) => {
    const newLog: LogEntry = {
      id: `log-${Date.now()}-${Math.random()}`,
      module,
      action,
      details,
      user: "manager@poultrypal.com",
      timestamp: new Date().toISOString(),
    };
    setLogs(prev => [newLog, ...prev].slice(0, LOG_LIMIT));
  };
  
  const addCompany = (name: string, logoUrl?: string) => {
    if (companies.some(c => c.name.toLowerCase() === name.toLowerCase().trim())) {
        return { success: false, message: "A company with this name already exists." };
    }
    const newCompanyId = `company_${Date.now()}`;
    const newCompany: Company = { id: newCompanyId, name: name.trim(), logoUrl };
    const newCompanies = [...companies, newCompany];
    setCompanies(newCompanies);

    const initial = getInitialData(name.trim());
    Object.entries(DATA_KEYS).forEach(([dataKey, storageKey]) => {
        localStorage.setItem(`${newCompanyId}_${storageKey}`, JSON.stringify(initial[dataKey as keyof typeof initial]));
    });

    addLogEntry("Company", "Added Company", `Name: ${name}`);
    return { success: true, message: "Company created successfully." };
  };

  const updateCompany = (companyId: string, updates: Partial<Omit<Company, 'id'>>) => {
    const companyToUpdate = companies.find(c => c.id === companyId);
    if (!companyToUpdate) {
      return { success: false, message: "Company not found." };
    }

    if (updates.name && companies.some(c => c.name.toLowerCase() === updates.name!.toLowerCase() && c.id !== companyId)) {
        return { success: false, message: "Another company with this name already exists." };
    }

    setCompanies(prev => prev.map(c => c.id === companyId ? { ...c, ...updates } : c));
    addLogEntry("Company", "Updated Company", `ID: ${companyId}, Updates: ${JSON.stringify(updates)}`);
    return { success: true, message: `Company "${updates.name || companyToUpdate.name}" updated.` };
  };

  const switchCompany = (companyId: string) => {
      localStorage.setItem(ACTIVE_COMPANY_KEY, companyId);
      window.location.reload();
  };

  const getBackupData = () => {
    if (!activeCompanyId) return JSON.stringify({});
    const backupData: Record<string, any> = {};
    Object.values(DATA_KEYS).forEach(key => {
        backupData[key] = JSON.parse(localStorage.getItem(`${activeCompanyId}_${key}`) || '[]');
    });
    return JSON.stringify(backupData, null, 2);
  };
  
  const restoreBackupData = (jsonData: string, newCompanyName: string) => {
    try {
        const data = JSON.parse(jsonData);
        if (companies.some(c => c.name.toLowerCase() === newCompanyName.toLowerCase().trim())) {
            return { success: false, message: "A company with the specified name already exists." };
        }
        
        const newCompanyId = `company_${Date.now()}`;
        const newCompany = { id: newCompanyId, name: newCompanyName.trim() };
        setCompanies(prev => [...prev, newCompany]);

        Object.entries(DATA_KEYS).forEach(([dataKey, storageKey]) => {
            if (data[storageKey]) {
                localStorage.setItem(`${newCompanyId}_${storageKey}`, JSON.stringify(data[storageKey]));
            }
        });
        
        return { success: true, message: `Backup restored to new company "${newCompanyName}".`};
    } catch (error) {
        return { success: false, message: "Invalid backup file format." };
    }
  };


  const logEggCollection = (log: { shed: string, large: number, medium: number, small: number, damaged: number, notes?: string }) => {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    let logUpdated = false;

    const newCollectionData = eggCollectionData.map(existingLog => {
      if (existingLog.shed === log.shed && existingLog.date === todayStr) {
        logUpdated = true;
        return {
          ...existingLog,
          large: existingLog.large + log.large,
          medium: existingLog.medium + log.medium,
          small: existingLog.small + log.small,
          damaged: existingLog.damaged + log.damaged,
          total: existingLog.total + log.large + log.medium + log.small,
          notes: log.notes ? `${existingLog.notes || ''}\n${log.notes}`.trim() : existingLog.notes,
        };
      }
      return existingLog;
    });

    if (!logUpdated) {
      const newLog: EggCollection = {
        logId: `E-${Date.now()}`,
        date: todayStr,
        shed: log.shed,
        large: log.large,
        medium: log.medium,
        small: log.small,
        damaged: log.damaged,
        total: log.large + log.medium + log.small,
        notes: log.notes,
      };
      newCollectionData.push(newLog);
    }
    
    setEggCollectionData(newCollectionData);
    
    addLogEntry("Egg Collection", "Logged Collection", `Shed: ${log.shed}, Total: ${log.large + log.medium + log.small} eggs`);
    return { success: true, message: "Egg collection logged successfully." };
  };

   const addHealthLog = (log: Omit<HealthEntry, 'logId' | 'date'>): { success: boolean, message: string } => {
    const newLog: HealthEntry = {
      ...log,
      logId: `H-${Date.now()}`,
      date: new Date().toISOString(),
    };

    if (log.eventType === "Mortality" && log.quantity > 0) {
      const batchIndex = chickData.findIndex(b => b.batchId === log.batchId);
      if (batchIndex !== -1) {
        const newChickData = [...chickData];
        const batch = newChickData[batchIndex];
        const newQuantity = batch.quantity - log.quantity;
        
        if (newQuantity < 0) {
            return { success: false, message: `Mortality count (${log.quantity}) cannot exceed batch quantity (${batch.quantity}).` };
        }
        
        newChickData[batchIndex] = { ...batch, quantity: newQuantity };
        setChickData(newChickData);
      } else {
         return { success: false, message: `Batch ID ${log.batchId} not found for mortality log.` };
      }
    }

    setHealthData(prev => [newLog, ...prev].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    addLogEntry("Chick Management", "Added Health Log", `Batch: ${log.batchId}, Event: ${log.eventType}, Qty: ${log.quantity}`);
    return { success: true, message: `Health record for ${log.eventType} added to batch ${log.batchId}.` };
  };

  const addChickBatch = (newBatchData: NewChickBatchData): { success: boolean, message: string } => {
    const today = new Date();
    const datePart = format(today, 'yyyyMMdd');
    const breedPart = newBatchData.breed.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 8);
    const supplierPart = newBatchData.supplier.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 6);
    const baseId = `${datePart}-${breedPart}-${supplierPart}`;

    let sequence = 1;
    let newBatchId = `${baseId}-${sequence.toString().padStart(2, '0')}`;
    
    while(chickData.some(batch => batch.batchId === newBatchId)) {
        sequence++;
        newBatchId = `${baseId}-${sequence.toString().padStart(2, '0')}`;
    }

    const fullNewBatch: Chick = {
      ...newBatchData,
      batchId: newBatchId,
      procurementDate: format(today, "yyyy-MM-dd"),
      age: Number(newBatchData.age) || 0,
      createdAt: today.toISOString(),
    }
    setChickData(prev => [fullNewBatch, ...prev].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    addLogEntry("Chick Management", "Added New Batch", `ID: ${fullNewBatch.batchId}, Qty: ${fullNewBatch.quantity}, Shed: ${fullNewBatch.shed}`);
    return { success: true, message: `Batch ${newBatchId} has been added.`};
  };

  const directAddChickBatch = (newBatchData: Omit<Chick, 'createdAt' | 'batchId' | 'procurementDate'> & { supplierId: string, costPerChick: number, totalAmount: number }): { success: boolean, message: string } => {
    const { supplierId, totalAmount, costPerChick, ...chickDetails } = newBatchData;

    const finalTotalAmount = totalAmount || (chickDetails.quantity * (costPerChick || 0));

    const po = addPurchaseOrder({
        supplierId,
        items: [{
            name: chickDetails.breed,
            category: 'Chicks',
            quantity: chickDetails.quantity,
            unit: 'pcs',
            costPerUnit: costPerChick,
            breed: chickDetails.breed,
            age: chickDetails.age,
        }],
    });
    
    if (po.success && po.poId) {
        addLogEntry("Chick Management", "Created Chick PO", `PO ID ${po.poId} for ${chickDetails.quantity} chicks from ${chickDetails.supplier}.`);
        return { success: true, message: `Pending Purchase Order ${po.poId} created for batch.` };
    }

    return { success: false, message: `Failed to create Purchase Order for the batch.` };
  };

  const transferChickBatch = (sourceBatchId: string, transferQty: number, newType: "Chick" | "Layer" | "Dated" | "", newShed: string) => {
    const sourceBatch = chickData.find((b) => b.batchId === sourceBatchId);
    if (!sourceBatch) {
      return { success: false, message: "Source batch not found." };
    }
    if (transferQty > sourceBatch.quantity) {
      return { success: false, message: "Transfer quantity exceeds available quantity."};
    }
    if (!newShed) {
        return { success: false, message: "New shed is required for transfer."};
    }

    // Generate a new, unique ID for the transferred batch
    const transferSuffix = `-T`;
    const transfersFromSource = chickData.filter(b => b.batchId.startsWith(sourceBatchId + transferSuffix)).length;
    const newTransferSeq = (transfersFromSource + 1).toString().padStart(2, '0');
    const newBatchId = `${sourceBatchId}${transferSuffix}${newTransferSeq}-${sourceBatch.shed.replace(/\s+/g, '')}-${newShed.replace(/\s+/g, '')}`;

    const newBatch: Chick = {
      batchId: newBatchId,
      breed: sourceBatch.breed,
      supplier: sourceBatch.supplier,
      procurementDate: sourceBatch.procurementDate,
      age: sourceBatch.age,
      shed: newShed,
      type: newType || sourceBatch.type,
      quantity: transferQty,
      createdAt: new Date().toISOString(),
      notes: `Transferred from ${sourceBatchId}`,
      totalCost: sourceBatch.costPerChick ? sourceBatch.costPerChick * transferQty : undefined,
      costPerChick: sourceBatch.costPerChick,
      purchaseOrderId: sourceBatch.purchaseOrderId,
    };

    setChickData(currentChickData => {
      const updatedChickData = currentChickData.map((batch) => {
        if (batch.batchId === sourceBatchId) {
          return { ...batch, quantity: batch.quantity - transferQty };
        }
        return batch;
      });
      return [newBatch, ...updatedChickData.filter((batch) => batch.quantity > 0)].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    });
    
    addLogEntry(
      "Chick Management",
      "Transferred/Split Batch",
      `${transferQty} birds from ${sourceBatchId} to new batch ${newBatchId}.`
    );
    return { success: true, message: `Transferred ${transferQty} from ${sourceBatchId} to new batch ${newBatchId}.`};
  };

  const addShed = (shedName: string) => {
    if (shedData.some(shed => shed.name.toLowerCase() === shedName.toLowerCase())) {
        return { success: false, message: "A shed with this name already exists."};
    }
    const newShed: Shed = { 
      name: shedName.trim(), 
      medsDue: 0,
      feedAtLastRefill: 0,
      lastRefillDate: null
    };
    setShedData(prev => [...prev, newShed]);
    addLogEntry("Shed Management", "Added New Shed", `Shed Name: ${shedName}`);
    return { success: true, message: `Shed "${shedName}" has been added.`};
  };
  
  const updateShed = (shedName: string, updates: Partial<Omit<Shed, 'name'>>): { success: boolean, message: string } => {
    setShedData(prev => prev.map(s => s.name === shedName ? { ...s, ...updates } : s));
    addLogEntry("Shed Management", "Updated Shed", `Name: ${shedName}, Updates: ${JSON.stringify(updates)}`);
    return { success: true, message: `Shed "${shedName}" updated.` };
  }

  const deleteShed = (shedName: string) => {
    if (chickData.some(chick => chick.shed === shedName && chick.quantity > 0)) {
        addLogEntry("Shed Management", "Deletion Failed", `Attempted to delete non-empty shed: ${shedName}`);
        return;
    }
    setShedData(prev => prev.filter(shed => shed.name !== shedName));
    addLogEntry("Shed Management", "Deleted Shed", `Shed Name: ${shedName}`);
  };

  const addItemToMaster = (item: Omit<ItemMaster, 'id'>): { success: boolean; message: string; } => {
    const itemNameLower = item.name.toLowerCase().trim();
    if (itemNameLower === 'eggs' || itemNameLower === 'egg' || itemNameLower === 'trays' || itemNameLower === 'tray') {
        return { success: false, message: `"${item.name}" is a reserved system item and cannot be added manually.`}
    }
    if (itemMaster.some(i => i.name.toLowerCase() === itemNameLower && i.category === item.category)) {
      return { success: false, message: "An item with this name and category already exists." };
    }
    const newItem: ItemMaster = {
      ...item,
      id: `ITEM-${Date.now()}`
    };
    setItemMaster(prev => [newItem, ...prev].sort((a, b) => a.name.localeCompare(b.name)));
    
    if (item.initialStock && item.initialStock > 0) {
        setFeedStockData(prev => [...prev, {
            id: `FS-INIT-${Date.now()}`,
            name: item.name,
            category: item.category as any,
            supplier: 'Initial Stock',
            stock: item.initialStock as number,
            unit: item.unit,
            costPerUnit: 0,
            purchaseDate: new Date().toISOString()
        }]);
    }

    addLogEntry("Items & Inventory", "Added Item", `Name: ${item.name}, Category: ${item.category}`);
    return { success: true, message: `Item "${item.name}" has been added to the item list.` };
  };

  const updateItemMaster = (itemId: string, updates: Partial<ItemMaster>): { success: boolean; message: string; } => {
    if (updates.name && itemMaster.some(i => i.name.toLowerCase() === updates.name!.toLowerCase().trim() && i.id !== itemId)) {
        return { success: false, message: "Another item with this name already exists." };
    }
    setItemMaster(prev => prev.map(item => item.id === itemId ? { ...item, ...updates } : item));
    addLogEntry("Items & Inventory", "Updated Item Master", `ID: ${itemId}, Updates: ${JSON.stringify(updates)}`);
    return { success: true, message: "Item details updated." };
  };

  const deleteItemMaster = (itemId: string): { success: boolean; message: string; } => {
    if (itemId.startsWith('SYS_')) {
        return { success: false, message: "System items cannot be deleted." };
    }
    const itemToDelete = itemMaster.find(i => i.id === itemId);
    if (!itemToDelete) {
        return { success: false, message: "Item not found." };
    }
    
    // Check if item is used in feed stock
    const isInFeedStock = feedStockData.some(fs => fs.name.toLowerCase() === itemToDelete.name.toLowerCase());
    if (isInFeedStock) {
        return { success: false, message: `Cannot delete "${itemToDelete.name}" as it is part of the current stock.` };
    }

    // Check if item is used in feed mixes
    const isInFeedMix = feedMixes.some(fm => fm.composition.some(ing => ing.itemMasterId === itemId));
    if (isInFeedMix) {
        return { success: false, message: `Cannot delete "${itemToDelete.name}" as it is used in a feed mix recipe.` };
    }

    setItemMaster(prev => prev.filter(i => i.id !== itemId));
    addLogEntry("Items & Inventory", "Deleted Item Master", `Name: ${itemToDelete.name}`);
    return { success: true, message: `Item "${itemToDelete.name}" has been deleted.` };
  };

  const addItemCategory = (categoryName: string): { success: boolean; message: string; } => {
    const trimmedName = categoryName.trim();
    if (itemCategories.some(c => c.name.toLowerCase() === trimmedName.toLowerCase())) {
        return { success: false, message: "This category already exists." };
    }
    setItemCategories(prev => [...prev, { id: `CAT-${Date.now()}`, name: trimmedName, subCategories: [] }].sort((a,b) => a.name.localeCompare(b.name)));
    addLogEntry("Items & Inventory", "Added Category", `Name: ${trimmedName}`);
    return { success: true, message: `Category "${trimmedName}" has been added.` };
  }

  const deleteItemCategory = (categoryId: string): { success: boolean; message: string; } => {
    const category = itemCategories.find(c => c.id === categoryId);
    if (!category) return { success: false, message: "Category not found."};

    if (itemMaster.some(item => item.category === category.name)) {
        return { success: false, message: `Cannot delete category "${category.name}" as it is currently in use.` };
    }
    setItemCategories(prev => prev.filter(c => c.id !== categoryId));
    addLogEntry("Items & Inventory", "Deleted Category", `Name: ${category.name}`);
    return { success: true, message: `Category "${category.name}" has been deleted.` };
  }
  
  const addSubCategory = (categoryId: string, subCategoryName: string): { success: boolean; message: string; } => {
    const trimmedName = subCategoryName.trim();
    setItemCategories(prev => prev.map(cat => {
        if (cat.id === categoryId) {
            if (cat.subCategories.some(sc => sc.toLowerCase() === trimmedName.toLowerCase())) {
                return cat; // Already exists
            }
            return { ...cat, subCategories: [...(cat.subCategories || []), trimmedName].sort() };
        }
        return cat;
    }));
    addLogEntry("Items & Inventory", "Added Sub-Category", `For Category ID: ${categoryId}, Name: ${trimmedName}`);
    return { success: true, message: `Sub-category "${trimmedName}" added.` };
  };

  const deleteSubCategory = (categoryId: string, subCategoryName: string): { success: boolean; message: string; } => {
      if (itemMaster.some(item => item.subCategory === subCategoryName)) {
        return { success: false, message: `Cannot delete sub-category "${subCategoryName}" as it is currently in use.` };
    }
     setItemCategories(prev => prev.map(cat => {
        if (cat.id === categoryId) {
            return { ...cat, subCategories: (cat.subCategories || []).filter(sc => sc !== subCategoryName) };
        }
        return cat;
    }));
    addLogEntry("Items & Inventory", "Deleted Sub-Category", `For Category ID: ${categoryId}, Name: ${subCategoryName}`);
    return { success: true, message: `Sub-category "${subCategoryName}" deleted.` };
  }
  
  const addItemType = (typeName: string): { success: boolean; message: string; } => {
    const trimmedName = typeName.trim();
    if (itemTypes.some(t => t.toLowerCase() === trimmedName.toLowerCase())) {
        return { success: false, message: "This item type already exists." };
    }
    setItemTypes(prev => [...prev, trimmedName].sort());
    addLogEntry("Items & Inventory", "Added Item Type", `Name: ${trimmedName}`);
    return { success: true, message: `Item Type "${trimmedName}" has been added.` };
  };
  
  const deleteItemType = (typeName: string): { success: boolean; message: string; } => {
    if (itemMaster.some(item => item.type === typeName)) {
        return { success: false, message: `Cannot delete type "${typeName}" as it is currently in use.` };
    }
    setItemTypes(prev => prev.filter(t => t !== typeName));
    addLogEntry("Items & Inventory", "Deleted Item Type", `Name: ${typeName}`);
    return { success: true, message: `Item Type "${typeName}" has been deleted.` };
  };

  const addPurchaseOrder = (poData: NewPurchaseOrderData): { success: boolean, message: string, poId?: string } => {
    const datePart = format(new Date(), 'yyyyMMdd');
    const supplier = suppliersData.find(s => s.id === poData.supplierId);
    const supplierPart = supplier ? supplier.name.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 5) : 'SUP';
    
    const dailyPOs = purchaseOrders.filter(po => po.id.startsWith(`PO-${datePart}`)).length;
    const sequence = (dailyPOs + 1).toString().padStart(2, '0');
    
    const poId = `PO-${datePart}-${supplierPart}-${sequence}`;

    const totalAmount = poData.items.reduce((sum, item) => sum + (item.quantity * item.costPerUnit), 0);
    
    const newPO: PurchaseOrder = {
        id: poId,
        date: new Date().toISOString(),
        supplierId: poData.supplierId,
        items: poData.items.map(item => ({ ...item, id: `POI-${Date.now()}-${Math.random()}`})),
        totalAmount,
        status: 'Pending',
    };
    setPurchaseOrders(prev => [newPO, ...prev]);
    addLogEntry("Purchase Orders", "Created PO", `ID: ${poId}, Supplier: ${supplier?.name || 'N/A'}`);
    return { success: true, message: `Purchase Order ${poId} created.`, poId: poId };
  };

  const logPaymentForPO = (poId: string, paymentDetails: Omit<Payment, 'id' | 'date' | 'supplierId' | 'amount' | 'description' | 'purchaseOrderId'>): { success: boolean, message: string } => {
    const po = purchaseOrders.find(p => p.id === poId);
    if (!po) return { success: false, message: "Purchase Order not found." };
    if (po.status === 'Paid') return { success: false, message: "This Purchase Order has already been paid." };

    setPurchaseOrders(prev => prev.map(p => p.id === poId ? { ...p, status: 'Paid' } : p));

    addPayment({
        ...paymentDetails,
        purchaseOrderId: po.id,
        amount: po.totalAmount,
        supplierId: po.supplierId,
    });
    
    const newStockItems: FeedStock[] = [];
    let eggsPurchased = 0;
    let traysPurchased = 0;
    
    po.items.forEach(item => {
      const itemNameLower = item.name.toLowerCase();
      if(item.category === 'Chicks') {
        const defaultShed = shedData[0]?.name || "Default Shed";
        addChickBatch({
          breed: item.breed || 'Unknown',
          quantity: item.quantity,
          age: item.age || 1,
          shed: defaultShed,
          supplier: suppliersData.find(s => s.id === po.supplierId)?.name || 'N/A',
          type: 'Chick',
          totalCost: item.quantity * item.costPerUnit,
          costPerChick: item.costPerUnit,
          notes: `Auto-created from PO ${po.id}. Assign to correct shed.`,
          purchaseOrderId: po.id,
        });
      } else if (itemNameLower === 'egg' || itemNameLower === 'eggs') {
        eggsPurchased += item.quantity;
      } else if (itemNameLower === 'tray' || itemNameLower === 'trays') {
        traysPurchased += item.quantity;
      } else {
        newStockItems.push({
            id: `FS-${Date.now()}-${Math.random()}`,
            name: item.name,
            category: item.category as any,
            supplier: suppliersData.find(s => s.id === po.supplierId)?.name || 'N/A',
            stock: item.quantity,
            unit: item.unit,
            costPerUnit: item.costPerUnit,
            purchaseDate: new Date().toISOString(),
            expiryDate: item.expiryDate,
            purchaseOrderId: po.id
        });
      }
    });

    setInventoryData(prev => ({
      ...prev,
      purchasedEggs: prev.purchasedEggs + eggsPurchased,
      emptyTrays: prev.emptyTrays + traysPurchased
    }));

    if (newStockItems.length > 0) {
      setFeedStockData(prev => [...prev, ...newStockItems]);
    }

    addLogEntry("Purchase Orders", "Logged PO Payment", `ID: ${po.id}, Stock/Chicks updated.`);
    return { success: true, message: `Payment for ${po.id} logged and stock has been updated.` };
  };

  const addFeedMix = (feedMix: Omit<FeedMix, 'id'> & { id?: string }): { success: boolean, message: string } => {
      if (feedMixes.some(f => f.name.toLowerCase() === feedMix.name.toLowerCase().trim())) {
        return { success: false, message: "A feed mix with this name already exists." };
      }
      const newFeedMix: FeedMix = {
        ...feedMix,
        id: feedMix.id || `FM-${Date.now()}-${Math.random()}`
      }
      setFeedMixes(prev => [newFeedMix, ...prev]);
      addLogEntry("Feed Manager", "Created Feed Mix", `Name: ${feedMix.name}`);
      return { success: true, message: `Feed mix "${feedMix.name}" has been created.` };
  };
  
  const updateFeedMix = (mixId: string, updatedData: Omit<FeedMix, 'id'>): { success: boolean, message: string } => {
    const mixExists = feedMixes.some(f => f.name.toLowerCase() === updatedData.name.toLowerCase().trim() && f.id !== mixId);
    if (mixExists) {
        return { success: false, message: "Another feed mix with this name already exists." };
    }
    setFeedMixes(prev => prev.map(mix => mix.id === mixId ? { ...mix, ...updatedData } : mix));
    addLogEntry("Feed Manager", "Updated Feed Mix", `ID: ${mixId}, Name: ${updatedData.name}`);
    return { success: true, message: "Feed mix updated successfully." };
  };

  const deleteFeedMix = (mixId: string): { success: boolean, message: string } => {
      const mixToDelete = feedMixes.find(m => m.id === mixId);
      if (!mixToDelete) {
          return { success: false, message: "Feed mix not found." };
      }
      setFeedMixes(prev => prev.filter(mix => mix.id !== mixId));
      addLogEntry("Feed Manager", "Deleted Feed Mix", `Name: ${mixToDelete.name}`);
      return { success: true, message: `Feed mix "${mixToDelete.name}" has been deleted.` };
  };

  const logFeedConsumption = (log: Omit<FeedConsumptionLog, 'logId' | 'date'>): { success: boolean, message: string } => {
    if (log.quantity <= 0) {
        return { success: false, message: "Consumption quantity must be positive." };
    }

    let tempFeedStock = [...feedStockData];
    let itemName = "";
    
    const shedIndex = shedData.findIndex(s => s.name === log.shed);
    if (shedIndex === -1) {
        return { success: false, message: "Shed not found." };
    }

    if (log.consumptionType === 'FeedMix') {
        const feedMix = feedMixes.find(fm => fm.id === log.itemId);
        if (!feedMix) {
            return { success: false, message: "Feed mix not found." };
        }
        itemName = feedMix.name;

        // Check stock availability first
        for (const ingredient of feedMix.composition) {
            const masterItem = itemMaster.find(im => im.id === ingredient.itemMasterId);
            if (!masterItem) {
                return { success: false, message: `Ingredient with ID ${ingredient.itemMasterId} not found in master list.` };
            }
            
            const availableStock = tempFeedStock
                .filter(fs => fs.name.toLowerCase() === masterItem.name.toLowerCase())
                .reduce((sum, item) => sum + item.stock, 0);

            const requiredStock = log.quantity * (ingredient.percentage / 100);

            if (availableStock < requiredStock) {
                return { success: false, message: `Insufficient stock for ${masterItem.name}. Required: ${requiredStock.toFixed(2)} ${masterItem.unit}, Available: ${availableStock.toFixed(2)} ${masterItem.unit}.` };
            }
        }

        // Deduct stock
        for (const ingredient of feedMix.composition) {
            const masterItem = itemMaster.find(im => im.id === ingredient.itemMasterId)!;
            let requiredStock = log.quantity * (ingredient.percentage / 100);

            const stockBatches = tempFeedStock
                .filter(fs => fs.name.toLowerCase() === masterItem.name.toLowerCase())
                .sort((a, b) => new Date(a.purchaseDate).getTime() - new Date(b.purchaseDate).getTime());

            for (const batch of stockBatches) {
                if (requiredStock <= 0) break;
                const stockToDeduct = Math.min(batch.stock, requiredStock);
                const batchIndex = tempFeedStock.findIndex(fs => fs.id === batch.id);
                tempFeedStock[batchIndex] = { ...batch, stock: batch.stock - stockToDeduct };
                requiredStock -= stockToDeduct;
            }
        }

        // Update shed's feed level
        const newShedData = [...shedData];
        newShedData[shedIndex] = {
            ...newShedData[shedIndex],
            feedAtLastRefill: (newShedData[shedIndex].feedAtLastRefill || 0) + log.quantity,
            lastRefillDate: new Date().toISOString(),
        };
        setShedData(newShedData);

    } else { // 'Health' consumption
        const stockIndex = tempFeedStock.findIndex(fs => fs.id === log.itemId);
        if (stockIndex === -1) {
            return { success: false, message: "Health item not found in stock." };
        }
        const stockItem = tempFeedStock[stockIndex];
        itemName = stockItem.name;
        if (stockItem.stock < log.quantity) {
            return { success: false, message: `Insufficient stock for ${stockItem.name}. Required: ${log.quantity}, Available: ${stockItem.stock}.` };
        }
        tempFeedStock[stockIndex] = { ...stockItem, stock: stockItem.stock - log.quantity };
    }

    setFeedStockData(tempFeedStock);
    
    const newLog: FeedConsumptionLog = {
        ...log,
        date: new Date().toISOString(),
        logId: `FCL-${Date.now()}-${Math.random()}`
    }
    setFeedConsumptionData(prev => [newLog, ...prev].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    addLogEntry("Feed Manager", "Logged Consumption", `Shed: ${log.shed}, Type: ${log.consumptionType}, Item: ${itemName}, Qty: ${log.quantity} ${log.unit}`);
    return { success: true, message: "Consumption logged and stock updated." };
}
  
  const todaysTotalEggCollection = useMemo(() => {
    if (isLoading) return 0;
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    return eggCollectionData
        .filter(log => log.date === todayStr)
        .reduce((sum, log) => sum + log.total, 0);
  }, [eggCollectionData, isLoading]);
  
  const getShedsWithDetails = useMemo(() => () => {
    const todayStr = format(new Date(), 'yyyy-MM-dd');

    const henCounts = chickData.reduce((acc, chick) => {
      if (!acc[chick.shed]) {
        acc[chick.shed] = { total: 0, Chick: 0, Layer: 0, Dated: 0 };
      }
      acc[chick.shed].total += chick.quantity;
      acc[chick.shed][chick.type] = (acc[chick.shed][chick.type] || 0) + chick.quantity;
      return acc;
    }, {} as Record<string, { total: number; Chick: number; Layer: number; Dated: number; }>);

    const todaysEggProductionByShed = eggCollectionData.reduce((acc, collection) => {
        if (collection.date === todayStr) {
            acc[collection.shed] = (acc[collection.shed] || 0) + collection.total;
        }
        return acc;
    }, {} as Record<string, number>);

    return shedData.map(shed => {
      const counts = henCounts[shed.name] || { total: 0, Chick: 0, Layer: 0, Dated: 0 };
      const eggProduction = todaysEggProductionByShed[shed.name] || 0;
      const layerCount = counts.Layer || 0;
      const productionPercentage = layerCount > 0 ? (eggProduction / layerCount) * 100 : 0;
      const henCountInShed = counts.total;
      
      const consumptionRateKgPerHour = (henCountInShed > 0 && feedSettings.hoursPerKgPerChick > 0)
          ? henCountInShed / feedSettings.hoursPerKgPerChick
          : 0;

      let remainingKg = shed.feedAtLastRefill;
      let remainingHours = Infinity;

       if (shed.lastRefillDate && shed.feedAtLastRefill > 0 && consumptionRateKgPerHour > 0) {
        const now = new Date();
        const lastLogTime = new Date(shed.lastRefillDate as string);
        const elapsedHours = (now.getTime() - lastLogTime.getTime()) / (1000 * 60 * 60);
        const consumedKg = elapsedHours * consumptionRateKgPerHour;
        remainingKg = Math.max(0, shed.feedAtLastRefill - consumedKg);
        remainingHours = remainingKg > 0 ? remainingKg / consumptionRateKgPerHour : 0;
      }
      
      return {
        ...shed,
        henCount: henCountInShed,
        chickCount: counts.Chick,
        layerCount: counts.Layer,
        datedCount: counts.Dated,
        eggProduction: eggProduction,
        productionPercentage: productionPercentage,
        consumptionRateKgPerHour: consumptionRateKgPerHour,
        remainingKg,
        remainingHours,
      };
    });
  }, [shedData, chickData, eggCollectionData, feedSettings]);

  const addSupplier = (supplier: Omit<Supplier, 'id'>): { success: boolean; message: string; } => {
    if (suppliersData.some(s => s.name.toLowerCase() === supplier.name.toLowerCase().trim())) {
      return { success: false, message: "A supplier with this name already exists." };
    }
    const newIdNumber = suppliersData.reduce((maxId, s) => {
      const currentIdNum = parseInt(String(s.id).replace(/\D/g, '') || '0', 10);
      return Math.max(maxId, currentIdNum);
    }, 0) + 1;
    
    const newSupplier: Supplier = {
      ...supplier,
      id: `SUP${newIdNumber.toString().padStart(3, '0')}`,
    };
    setSuppliersData(prev => [...prev, newSupplier]);
    addLogEntry("Suppliers", "Added Supplier", `Name: ${supplier.name}`);
    return { success: true, message: `Supplier "${supplier.name}" added successfully.` };
  };

  const updateSupplier = (supplierId: string, updates: Partial<Omit<Supplier, 'id'>>): { success: boolean; message: string; } => {
    setSuppliersData(prev => prev.map(s => s.id === supplierId ? { ...s, ...updates } : s));
    addLogEntry("Suppliers", "Updated Supplier", `ID: ${supplierId}, Updates: ${JSON.stringify(updates)}`);
    return { success: true, message: "Supplier details updated." };
  };
  
  const deleteSupplier = (supplierId: string): { success: boolean; message: string; } => {
    const supplier = suppliersData.find(s => s.id === supplierId);
    if (!supplier) {
      return { success: false, message: "Supplier not found." };
    }
    
    const isUsedInChickData = chickData.some(c => c.supplier === supplier.name);
    const isUsedInFeedStock = feedStockData.some(f => f.supplier === supplier.name);
    if (isUsedInChickData || isUsedInFeedStock) {
        return { success: false, message: `Cannot delete "${supplier.name}" as it is currently linked to chick or feed stock.`}
    }

    setSuppliersData(prev => prev.filter(s => s.id !== supplierId));
    addLogEntry("Suppliers", "Deleted Supplier", `Name: ${supplier.name}`);
    return { success: true, message: `Supplier "${supplier.name}" has been deleted.` };
  };

  const addStaff = (staff: Omit<Staff, 'id'>): { success: boolean, message: string } => {
    const newIdNumber = staffData.reduce((maxId, s) => {
      const currentIdNum = parseInt(String(s.id).replace(/\D/g, '') || '0', 10);
      return Math.max(maxId, currentIdNum);
    }, 0) + 1;

    const newStaff: Staff = {
        ...staff,
        id: `STF${newIdNumber.toString().padStart(3, '0')}`,
    };
    setStaffData(prev => [newStaff, ...prev]);
    addLogEntry("Staff Management", "Added Staff", `Name: ${staff.name}, Role: ${staff.role}`);
    return { success: true, message: `Staff member "${staff.name}" has been added.` };
  };

  const updateStaff = (staff: Staff): { success: boolean; message: string; } => {
    setStaffData(prev => prev.map(s => s.id === staff.id ? staff : s));
    addLogEntry("Staff Management", "Updated Staff", `Name: ${staff.name}`);
    return { success: true, message: "Staff details updated." };
  };

  const deleteStaff = (staffId: string): { success: boolean; message: string; } => {
    const staffToDelete = staffData.find(s => s.id === staffId);
    if (!staffToDelete) return { success: false, message: "Staff member not found." };
    
    setStaffData(prev => prev.filter(s => s.id !== staffId));
    addLogEntry("Staff Management", "Deleted Staff", `Name: ${staffToDelete.name}`);
    return { success: true, message: `Staff member "${staffToDelete.name}" has been deleted.` };
  };

  const setStaffStatus = (staffId: string, status: 'Active' | 'Inactive'): { success: boolean; message: string; } => {
     const staffToUpdate = staffData.find(s => s.id === staffId);
    if (!staffToUpdate) return { success: false, message: "Staff member not found." };

    setStaffData(prev => prev.map(s => s.id === staffId ? { ...s, status } : s));
    addLogEntry("Staff Management", "Updated Staff Status", `Name: ${staffToUpdate.name}, New Status: ${status}`);
    return { success: true, message: `${staffToUpdate.name}'s status set to ${status}.` };
  };

  const logAttendance = (dailyRecords: { staffId: string; status: 'Present' | 'Absent' | 'Leave', date?: string }[]): { success: boolean; message: string; } => {
    const logsToUpdate = [...attendanceData];

    dailyRecords.forEach(record => {
      const logDate = record.date || format(new Date(), 'yyyy-MM-dd');
      const existingLogIndex = logsToUpdate.findIndex(log => log.date === logDate && log.staffId === record.staffId);
      
      // Upsert the log
      if (existingLogIndex !== -1) {
        logsToUpdate[existingLogIndex] = { ...logsToUpdate[existingLogIndex], status: record.status };
      } else {
        logsToUpdate.push({ id: `ATT-${logDate}-${record.staffId}`, date: logDate, ...record });
      }
    });

    setAttendanceData(logsToUpdate);

    addLogEntry("Staff Management", "Logged Attendance", `Logged attendance for ${dailyRecords.length} staff members.`);
    return { success: true, message: "Attendance for today has been recorded." };
  };
  
  const requestLeave = (staffId: string, leaveDate: string, reason: string): { success: boolean; message: string } => {
    const newRequest: LeaveRequest = {
        id: `LR-${Date.now()}`,
        staffId,
        requestDate: new Date().toISOString(),
        leaveDate,
        reason,
        status: 'Pending',
    };
    setLeaveRequests(prev => [newRequest, ...prev]);
    addLogEntry("Staff Management", "Requested Leave", `Staff ID: ${staffId}, Date: ${leaveDate}`);
    return { success: true, message: "Leave request submitted for approval." };
  };

  const approveLeave = (leaveRequestId: string): { success: boolean; message: string; } => {
      const request = leaveRequests.find(r => r.id === leaveRequestId);
      if (!request) return { success: false, message: "Leave request not found." };
      
      const staff = staffData.find(s => s.id === request.staffId);
      if (!staff) return { success: false, message: "Staff member not found." };

      // Approve request
      setLeaveRequests(prev => prev.map(r => r.id === leaveRequestId ? { ...r, status: 'Approved' } : r));

      // Log attendance
      logAttendance([{ staffId: request.staffId, status: 'Leave', date: request.leaveDate }]);

      addLogEntry("Staff Management", "Approved Leave", `Request ID: ${leaveRequestId}`);
      return { success: true, message: `Leave for ${staff.name} on ${request.leaveDate} approved.` };
  };

  const denyLeave = (leaveRequestId: string): { success: boolean; message: string; } => {
      const request = leaveRequests.find(r => r.id === leaveRequestId);
      if (!request) return { success: false, message: "Leave request not found." };
      
      // Deny request
      setLeaveRequests(prev => prev.map(r => r.id === leaveRequestId ? { ...r, status: 'Denied' } : r));
      
      // Log attendance as absent
      logAttendance([{ staffId: request.staffId, status: 'Absent', date: request.leaveDate }]);
      
      const staffName = staffData.find(s => s.id === request.staffId)?.name || 'Unknown';
      addLogEntry("Staff Management", "Denied Leave", `Request ID: ${leaveRequestId}`);
      return { success: true, message: `Leave for ${staffName} on ${request.leaveDate} denied.` };
  };


  const addVehicle = (vehicle: Omit<Vehicle, 'id'>): { success: boolean, message: string } => {
    if (vehicleData.some(v => v.registrationNumber.toLowerCase() === vehicle.registrationNumber.toLowerCase().trim())) {
      return { success: false, message: "A vehicle with this registration number already exists." };
    }
    const newIdNumber = vehicleData.reduce((maxId, v) => {
      const currentIdNum = parseInt(String(v.id).replace(/\D/g, '') || '0', 10);
      return Math.max(maxId, currentIdNum);
    }, 0) + 1;

    const newVehicle: Vehicle = {
        ...vehicle,
        id: `VEH${newIdNumber.toString().padStart(3, '0')}`,
    };
    setVehicleData(prev => [newVehicle, ...prev]);
    addLogEntry("Staff & Vehicle", "Added Vehicle", `Reg. No: ${vehicle.registrationNumber}`);
    return { success: true, message: `Vehicle ${vehicle.registrationNumber} has been added.` };
  }
  
  const addFuelLog = (log: Omit<FuelLog, 'id'>): { success: boolean; message: string; } => {
    const newLog: FuelLog = { ...log, id: `FUEL-${Date.now()}` };
    setFuelLogData(prev => [newLog, ...prev]);
    const vehicle = vehicleData.find(v => v.id === log.vehicleId);
    addLogEntry("Staff & Vehicle", "Logged Fuel", `Vehicle: ${vehicle?.registrationNumber || 'N/A'}, Liters: ${log.liters}`);
    return { success: true, message: "Fuel log added successfully." };
  };
  
  const addVehicleMaintenanceLog = (log: Omit<VehicleMaintenanceLog, 'id'>): { success: boolean; message: string; } => {
    const newLog: VehicleMaintenanceLog = { ...log, id: `MAINT-${Date.now()}` };
    setVehicleMaintenanceLogData(prev => [newLog, ...prev]);
    
    // Update the vehicle's last maintenance date
    setVehicleData(prev => prev.map(v => v.id === log.vehicleId ? { ...v, lastMaintenanceDate: log.date } : v));

    const vehicle = vehicleData.find(v => v.id === log.vehicleId);
    addLogEntry("Staff & Vehicle", "Logged Maintenance", `Vehicle: ${vehicle?.registrationNumber || 'N/A'}, Cost: ${log.cost}`);
    return { success: true, message: "Maintenance log added successfully." };
  };

  const addCustomer = (customer: Omit<Customer, 'id' | 'emptyTraysHeld'>): { success: boolean, message: string } => {
    if (customerData.some(c => c.name.toLowerCase() === customer.name.toLowerCase().trim())) {
      return { success: false, message: "A customer with this name already exists." };
    }
    const newIdNumber = customerData.reduce((maxId, c) => {
      const currentIdNum = parseInt(String(c.id).replace(/\D/g, '') || '0', 10);
      return Math.max(maxId, currentIdNum);
    }, 0) + 1;

    const newCustomer: Customer = {
      ...customer,
      id: `CUST${newIdNumber.toString().padStart(3, '0')}`,
      emptyTraysHeld: 0,
    };
    setCustomerData(prev => [newCustomer, ...prev]);
    addLogEntry("Customers", "Added Customer", `Name: ${customer.name}`);
    return { success: true, message: `Customer "${customer.name}" added.` };
  };
  
  const addDispatch = (dispatch: Omit<Dispatch, 'invoiceId' | 'date' | 'status' | 'driver'>): { success: boolean, message: string } => {
    const datePart = format(new Date(), 'yyyyMMdd');
    const customerNamePart = dispatch.customerName.replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase();
    const itemPart = dispatch.dispatchType === 'Eggs' 
        ? `EGSx${dispatch.trays || 0}`
        : `CKSx${dispatch.chickQuantity || 0}`;
    const invoiceNumber = (dispatchData.filter(d => d.date === format(new Date(), 'yyyy-MM-dd')).length + 1).toString().padStart(3, '0');

    const newDispatch: Dispatch = {
      ...dispatch,
      invoiceId: `INV-${datePart}-${customerNamePart}-${itemPart}-${invoiceNumber}`,
      date: format(new Date(), 'yyyy-MM-dd'),
      status: 'Pending',
      driver: 'Unassigned',
    };

    // Auto-generate a credit note for the dispatch
    const newCreditNote: CreditNote = {
      id: `CN-${newDispatch.invoiceId}`,
      date: new Date().toISOString(),
      entityId: newDispatch.customerId,
      entityType: 'Customer',
      amount: newDispatch.totalAmount,
      reason: `Dispatch of goods under invoice ${newDispatch.invoiceId}`,
      reference: newDispatch.invoiceId,
    };
    
    setDispatchData(prev => [newDispatch, ...prev]);
    setCreditNoteData(prev => [newCreditNote, ...prev]);

    // Deduct stock
    const dispatchTypeLower = newDispatch.dispatchType.toLowerCase();
    const isEggDispatch = dispatchTypeLower.includes('egg');

    if (isEggDispatch) {
        setInventoryData(prev => ({
            ...prev,
            readyStock: prev.readyStock - (newDispatch.eggs || 0),
        }));
         if (newDispatch.trays) {
            setInventoryData(prev => ({...prev, emptyTrays: prev.emptyTrays - newDispatch.trays! }));
        }
    }

    if (isEggDispatch && newDispatch.trays) {
      setCustomerData(prev => prev.map(c => 
          c.id === newDispatch.customerId ? { ...c, emptyTraysHeld: (c.emptyTraysHeld || 0) + newDispatch.trays! } : c
      ));
    }
    
    addLogEntry("Dispatch", "Created Dispatch", `Invoice: ${newDispatch.invoiceId} for ${dispatch.customerName}`);
    return { success: true, message: `Dispatch ${newDispatch.invoiceId} created.` };
  };

  const updateDispatchStatus = (dispatchId: string, status: Dispatch['status']): { success: boolean, message: string } => {
    setDispatchData(prev => prev.map(d => d.invoiceId === dispatchId ? { ...d, status } : d));
    addLogEntry("Dispatch", "Updated Status", `Invoice: ${dispatchId}, Status: ${status}`);
    return { success: true, message: "Dispatch status updated." };
  };
  
  const logTrayCollection = (customerId: string, traysCollected: number): { success: boolean; message: string; } => {
    const customer = customerData.find(c => c.id === customerId);
    if (!customer) {
        return { success: false, message: "Customer not found." };
    }
    
    setCustomerData(prev => prev.map(c => 
        c.id === customerId ? { ...c, emptyTraysHeld: Math.max(0, (c.emptyTraysHeld || 0) - traysCollected) } : c
    ));

    setInventoryData(prev => ({
        ...prev,
        emptyTrays: prev.emptyTrays + traysCollected,
    }));
    
    addLogEntry("Customers", "Collected Empty Trays", `Customer: ${customer.name}, Qty: ${traysCollected}`);
    return { success: true, message: `Collected ${traysCollected} trays from ${customer.name}.` };
  };
  
  const processReturn = (returnData: SupplierReturn): { success: boolean, message: string } => {
    const dispatch = dispatchData.find(d => d.invoiceId === returnData.dispatchId);
    if (!dispatch) {
      return { success: false, message: "Original dispatch not found." };
    }
    const { undeliveredEggs, damagedEggs, collectedTrays, remarks } = returnData;
    const totalReturnedEggs = undeliveredEggs + damagedEggs;

    if (totalReturnedEggs > (dispatch.eggs || 0)) {
        return { success: false, message: "Returned eggs cannot exceed dispatched quantity." };
    }

    // Add undelivered eggs back to stock
    setInventoryData(prev => ({
        ...prev,
        readyStock: prev.readyStock + undeliveredEggs,
    }));
    // Add damaged eggs to broken stock
    setInventoryData(prev => ({
        ...prev,
        brokenStock: prev.brokenStock + damagedEggs,
    }));
    
    // Log tray collection
    if (collectedTrays > 0) {
        logTrayCollection(dispatch.customerId, collectedTrays);
    }
    
    // Create a credit note for the returned value
    const returnedValue = totalReturnedEggs * (dispatch.pricePerEgg || 0);
    if (returnedValue > 0) {
        addCreditNote({
            entityType: 'Customer',
            entityId: dispatch.customerId,
            amount: returnedValue,
            reason: `Return from Invoice ${dispatch.invoiceId}. Undelivered: ${undeliveredEggs}, Damaged: ${damagedEggs}. ${remarks || ''}`.trim(),
            reference: dispatch.invoiceId,
        });
    }

    addLogEntry("Return Manager", "Processed Return", `Dispatch: ${dispatch.invoiceId}, Returned: ${totalReturnedEggs} eggs`);
    return { success: true, message: "Return processed and credit note issued." };
  };


  const addRouteName = (routeName: string): { success: boolean; message: string; } => {
    const trimmedName = routeName.trim();
    if (routeNames.some(r => r.toLowerCase() === trimmedName.toLowerCase())) {
        return { success: false, message: "This route name already exists." };
    }
    setRouteNames(prev => [...prev, trimmedName]);
    addLogEntry("Dispatch", "Created Route", `Name: ${trimmedName}`);
    return { success: true, message: `Route "${trimmedName}" has been created.` };
  };

  // Accounting functions
  const addBankAccount = (account: Omit<BankAccount, 'id'>): { success: boolean; message: string; } => {
    if (bankAccounts.some(b => b.accountName.toLowerCase() === account.accountName.toLowerCase().trim())) {
      return { success: false, message: "A bank account with this name already exists." };
    }
    const newId = `BA-${Date.now()}`;
    setBankAccounts(prev => [...prev, { id: newId, ...account }]);
    addLogEntry("Accounts", "Added Bank Account", `Name: ${account.accountName}`);
    return { success: true, message: "Bank account added." };
  }

  const addExpense = (expense: Omit<Expense, 'id' | 'date'>): { success: boolean; message: string; } => {
    const newId = `EXP-${Date.now()}`;
    setExpenseData(prev => [{ id: newId, date: new Date().toISOString(), ...expense }, ...prev]);
    addLogEntry("Accounts", "Added Expense", `Category: ${expense.category}, Amount: ${expense.amount}`);
    return { success: true, message: "Expense logged successfully." };
  }

  const addPayment = (payment: Omit<Payment, 'id' | 'date'> & { date?: string }): { success: boolean, message: string } => {
    const newId = payment.purchaseOrderId ? `PAY-${payment.purchaseOrderId}` : `PAY-${Date.now()}`;
    const newPayment: Payment = { id: newId, date: new Date().toISOString(), ...payment };
    setPaymentData(prev => [newPayment, ...prev]);

    // If payment is linked to a credit note, we need to resolve it.
    if (newPayment.creditNoteId) {
        setCreditNoteData(prev => prev.filter(cn => cn.id !== newPayment.creditNoteId));
    }

    const paymentType = newPayment.customerId ? "Inward" : "Outward";
    addLogEntry("Accounts", "Added Payment", `Type: ${paymentType}, Amount: ${newPayment.amount}, ID: ${newId}`);
    return { success: true, message: `${paymentType} payment logged successfully.` };
  }
  
  const addCreditNote = (note: Omit<CreditNote, 'id' | 'date'>): { success: boolean; message: string; } => {
    const newId = `CN-${note.entityType.substring(0,3).toUpperCase()}-${Date.now()}`;
    const newNote: CreditNote = {
      ...note,
      id: newId,
      date: new Date().toISOString()
    };
    setCreditNoteData(prev => [newNote, ...prev]);
    addLogEntry("Accounts", "Added Credit Note", `ID: ${newId}, Amount: ${note.amount}`);
    return { success: true, message: "Credit note logged successfully." };
  }

  const addDebitNote = (note: Omit<DebitNote, 'id' | 'date'>): { success: boolean; message: string; } => {
    const newId = `DN-${note.entityType.substring(0,3).toUpperCase()}-${Date.now()}`;
    const newNote: DebitNote = {
      ...note,
      id: newId,
      date: new Date().toISOString()
    };
    setDebitNoteData(prev => [newNote, ...prev]);
    addLogEntry("Accounts", "Added Debit Note", `ID: ${newId}, Amount: ${note.amount}`);
    return { success: true, message: "Debit note logged successfully." };
  }
  
  // Task Manager Functions
  const addProject = (title: string): { success: boolean; message: string } => {
    if (projects.some(p => p.title.toLowerCase() === title.toLowerCase().trim())) {
      return { success: false, message: "A project with this title already exists." };
    }
    const newProject: Project = { id: `PROJ-${Date.now()}`, title };
    setProjects(prev => [newProject, ...prev]);
    addLogEntry("Task Manager", "Created Project", `Title: ${title}`);
    return { success: true, message: `Project "${title}" created.` };
  };

  const addTask = (taskData: Omit<Task, 'id' | 'status'>): { success: boolean; message: string } => {
    if (!projects.some(p => p.id === taskData.projectId)) {
        addProject("Shed Health & Medication");
    }
    const newTask: Task = {
      ...taskData,
      id: `TASK-${Date.now()}`,
      status: 'To Do',
    };
    setTasks(prev => [newTask, ...prev]);
    addLogEntry("Task Manager", "Added Task", `Title: ${taskData.title}, Project ID: ${taskData.projectId}`);
    return { success: true, message: "Task added." };
  };
  
  const updateTask = (taskId: string, updates: Partial<Omit<Task, 'id' | 'projectId' | 'title'>>): { success: boolean; message: string } => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updates } : t));
    const updatedTask = tasks.find(t => t.id === taskId);
    addLogEntry("Task Manager", "Updated Task", `Task ID: ${taskId}, Updates: ${JSON.stringify(updates)}`);
    return { success: true, message: "Task updated." };
  };

  const deleteTask = (taskId: string): { success: boolean; message: string } => {
    const taskToDelete = tasks.find(t => t.id === taskId);
    if (!taskToDelete) return { success: false, message: "Task not found." };
    
    setTasks(prev => prev.filter(t => t.id !== taskId));
    addLogEntry("Task Manager", "Deleted Task", `Title: ${taskToDelete.title}`);
    return { success: true, message: "Task deleted." };
  };

  const updateFeedSettings = (settings: Partial<FeedSettings>) => {
    setFeedSettings(prev => ({ ...prev, ...settings }));
    addLogEntry("Settings", "Updated Feed Settings", `New settings: ${JSON.stringify(settings)}`);
  };
  
  const updateAlertConfig = (alertId: string, updates: Partial<AlertConfig>): { success: boolean; message: string; } => {
    setAlertConfigs(prev => prev.map(ac => ac.id === alertId ? { ...ac, ...updates } : ac));
    addLogEntry("Settings", "Updated Alert Config", `ID: ${alertId}, Updates: ${JSON.stringify(updates)}`);
    return { success: true, message: "Alert settings updated." };
  };


  const allSheds = useMemo(() => shedData.map(s => s.name).sort(), [shedData]);
  const uniqueSuppliers = useMemo(() => {
    const poSuppliers = purchaseOrders.map(po => suppliersData.find(s => s.id === po.supplierId)?.name).filter(Boolean);
    const chickSuppliers = chickData.map(c => c.supplier);
    const allKnownSuppliers = suppliersData.map(s => s.name);
    return [...new Set([...poSuppliers as string[], ...chickSuppliers, ...allKnownSuppliers])].sort();
  }, [purchaseOrders, suppliersData, chickData]);

  const activeCompany = useMemo(() => {
    if (!activeCompanyId) return null;
    return companies.find(c => c.id === activeCompanyId) || null;
  }, [activeCompanyId, companies]);

  const activeCompanyName = activeCompany?.name || 'PoultryPal';


  return (
    <FarmContext.Provider value={{ 
        chickData, 
        shedData,
        healthData, 
        logs,
        eggCollectionData,
        itemMaster,
        itemCategories,
        itemTypes,
        feedStockData,
        purchaseOrders,
        feedMixes,
        feedConsumptionData,
        suppliersData,
        staffData,
        vehicleData,
        fuelLogData,
        vehicleMaintenanceLogData,
        customerData,
        dispatchData,
        companies,
        inventoryData,
        routeNames,
        projects,
        tasks,
        activeCompany,
        bankAccounts,
        expenseData,
        paymentData,
        creditNoteData,
        debitNoteData,
        feedSettings,
        attendanceData,
        leaveRequests,
        alertConfigs,
        addChickBatch,
        directAddChickBatch, 
        transferChickBatch, 
        addShed,
        updateShed,
        deleteShed,
        addLogEntry,
        logEggCollection,
        addHealthLog,
        getShedsWithDetails,
        addItemToMaster,
        updateItemMaster,
        deleteItemMaster,
        addItemCategory,
        deleteItemCategory,
        addSubCategory,
        deleteSubCategory,
        addItemType,
        deleteItemType,
        addPurchaseOrder,
        logPaymentForPO,
        addFeedMix,
        updateFeedMix,
        deleteFeedMix,
        logFeedConsumption,
        addSupplier,
        updateSupplier,
        deleteSupplier,
        addStaff,
        updateStaff,
        deleteStaff,
        setStaffStatus,
        logAttendance,
        requestLeave,
        approveLeave,
        denyLeave,
        addVehicle,
        addFuelLog,
        addVehicleMaintenanceLog,
        addCustomer,
        addDispatch,
        updateDispatchStatus,
        logTrayCollection,
        processReturn,
        addCompany,
        updateCompany,
        switchCompany,
        getBackupData,
        restoreBackupData,
        addRouteName,
        addBankAccount,
        addExpense,
        addPayment,
        addCreditNote,
        addDebitNote,
        addProject,
        addTask,
        updateTask,
        deleteTask,
        updateFeedSettings,
        updateAlertConfig,
        allSheds,
        uniqueSuppliers,
        todaysTotalEggCollection,
        isLoading,
        activeCompanyName
    }}>
      {children}
    </FarmContext.Provider>
  );
};

export const useFarm = () => {
  const context = useContext(FarmContext);
  if (context === undefined) {
    throw new Error('useFarm must be used within a FarmProvider');
  }
  return context;
};
