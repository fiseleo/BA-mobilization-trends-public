import type { FC } from "react";
import { useState } from "react";
import type { ChangeEvent } from "react";
import { useTranslation } from "react-i18next";
import { useEventPlanStore, type EventPlan } from "~/store/planner/useEventPlanStore";
import { useGlobalStore, type GrowthPlan } from "~/store/planner/useGlobalStore";

export const ExportImportPanel: FC = () => {
  const [message, setMessage] = useState<string>('');
  const { t } = useTranslation("planner");


  // Full data structure to be stored in JSON file
  interface FullPlannerState {
    eventPlans: Record<string, Partial<EventPlan>>;
    globalPlans: GrowthPlan[];
    timestamp: string;
    version: string;
  }

  /**
   * Export the current global status to a JSON file.
   */
  const exportState = (): void => {
    const eventPlans = useEventPlanStore.getState().plans;
    const globalPlans = useGlobalStore.getState().growthPlans;

    const fullState: FullPlannerState = {
      eventPlans: eventPlans,
      globalPlans: globalPlans,
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    };

    const jsonString = JSON.stringify(fullState, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `BA_Planner_State_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setMessage('Success');
  };

  /**
   * Read the JSON file to restore the status of the Zustand store.
   */
  const importState = (e: ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event: ProgressEvent<FileReader>) => {
      try {
        const jsonString = event.target?.result;
        if (typeof jsonString !== 'string') throw new Error('File content is not a valid string.');

        const importedState: FullPlannerState = JSON.parse(jsonString);

        if (importedState.version && importedState.version !== '1.0.0') {
          console.warn(`[Import] Warning: Data version mismatch. Imported: ${importedState.version}, Current: 1.0.0`);
        }

        if (importedState.eventPlans) {
          useEventPlanStore.getState().resetAllPlans(importedState.eventPlans as Record<number, EventPlan>);
        }

        if (importedState.globalPlans) {
          useGlobalStore.getState().setGrowthPlans(importedState.globalPlans);
        }

        e.target.value = '';

        setMessage('Success');
        location = location
      } catch (error) {
        console.error('Failed to get status:', error);
        setMessage(`${t('error.errorFileFormatOrParsingFailed')} ${error instanceof Error ? error.message : String(error)}`);
      }
    };
    reader.onerror = () => {
      setMessage(t('error.errorCannotReadFile'));
    };
    reader.readAsText(file);
  };

  /**
   * Initialize all states; get confirmation from the user.
   */
  const resetState = (): void => {
    // Informs the user that this is an irreversible task and receives confirmation.
    const isConfirmed = window.confirm(
      t('error.confirmResetPlanData')
    );

    if (isConfirmed) {
      try {
        // Resets the state of each store to its initial state.
        useEventPlanStore.getState().resetAllPlans({});
        useGlobalStore.getState().setGrowthPlans([]);

        setMessage('Success');
        location = location
      } catch (error) {
        console.error('State initialization failed:', error);
        setMessage(`${t('error.errorDataInitializationFailed')} ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  };

  return (
    <div className="p-4   rounded-xl border border-gray-200 dark:border-neutral-700">
      <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">{t('page.dataManagement')}</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        {t("ui.dataManagementDescription")}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          onClick={exportState}
          className="w-full bg-transparent hover:bg-indigo-600 text-indigo-700 dark:text-indigo-400 hover:text-white py-3 px-6 border border-indigo-600 dark:border-indigo-500 dark:hover:bg-indigo-500 rounded-lg font-semibold transition duration-150 transform hover:scale-[1.01]"
        >
          {t('button.exportData')}
        </button>

        <label className="w-full cursor-pointer bg-transparent hover:bg-green-500 text-green-600 dark:text-green-400 hover:text-white py-3 px-6 border border-green-500 dark:border-green-500 dark:hover:bg-green-600 rounded-lg font-semibold transition duration-150 transform hover:scale-[1.01] text-center">
          {t('button.importData')}
          <input
            type="file"
            accept=".json"
            onChange={importState}
            className="hidden"
          />
        </label>

        <button
          onClick={resetState}
          className="w-full bg-transparent hover:bg-red-600 text-red-700 dark:text-red-500 hover:text-white py-3 px-6 border border-red-600 dark:border-red-600 dark:hover:bg-red-500 rounded-lg font-semibold transition duration-150 transform hover:scale-[1.01]"
        >
          {t('button.resetData')}
        </button>
      </div>

      {message && (
        <p className={`mt-4 p-3 rounded-lg text-sm font-medium ${message.startsWith('❌')
          ? 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400'
          : 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400'}`}>
          {message}
        </p>
      )}
    </div>
  );
}

export default ExportImportPanel;