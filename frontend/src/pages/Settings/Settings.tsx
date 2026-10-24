import { Label, Select, ToggleSwitch, Button } from "flowbite-react";
import { useState } from "react";

export default function Settings() {
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [pushAlerts, setPushAlerts] = useState(true);
  const [budgetAlerts, setBudgetAlerts] = useState(true);
  const [weeklySummary, setWeeklySummary] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 dark:border-gray-800 dark:bg-white/3">
        <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
          Preferences
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="currency">Currency</Label>
            <Select id="currency" defaultValue="USD">
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="TND">TND (د.ت)</option>
              <option value="GBP">GBP (£)</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="dateFormat">Date Format</Label>
            <Select id="dateFormat" defaultValue="DD/MM/YYYY">
              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
            </Select>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 dark:border-gray-800 dark:bg-white/3">
        <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
          Notification Settings
        </h3>
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-800 dark:text-white/90">Email Alerts</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Receive important alerts by email
              </p>
            </div>
            <ToggleSwitch checked={emailAlerts} onChange={setEmailAlerts} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-800 dark:text-white/90">Push Notifications</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Real-time alerts via browser/mobile push
              </p>
            </div>
            <ToggleSwitch checked={pushAlerts} onChange={setPushAlerts} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-800 dark:text-white/90">Budget Alerts</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Notify when a budget category is near or over its limit
              </p>
            </div>
            <ToggleSwitch checked={budgetAlerts} onChange={setBudgetAlerts} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-800 dark:text-white/90">Weekly Summary</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Get a spending recap every Monday
              </p>
            </div>
            <ToggleSwitch checked={weeklySummary} onChange={setWeeklySummary} />
          </div>
        </div>
        <div className="mt-5 flex justify-end">
          <Button>Save Preferences</Button>
        </div>
      </div>

      <div className="rounded-2xl border border-red-200 bg-white p-5 sm:p-6 dark:border-red-900/40 dark:bg-white/3">
        <h3 className="mb-1 text-lg font-semibold text-red-600 dark:text-red-400">
          Danger Zone
        </h3>
        <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
          Deleting your account permanently removes all transactions, budgets, and accounts.
        </p>
        <Button color="failure">Delete Account</Button>
      </div>
    </div>
  );
}