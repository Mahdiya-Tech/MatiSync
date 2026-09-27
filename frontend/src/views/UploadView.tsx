import React, { useState } from 'react';
import { Upload, FileText, CheckCircle2, AlertTriangle, Download, ArrowLeft, Database, Info } from 'lucide-react';

interface Props {
  onBack: () => void;
  onUploadSuccess: () => void;
}

export const UploadView: React.FC<Props> = ({ onBack, onUploadSuccess }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [cpseCode, setCpseCode] = useState('CPCL');
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setResult(null);
      setError(null);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setUploading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('cpse_code', cpseCode);

    try {
      const API_BASE = import.meta.env.VITE_API_URL || '';
      const res = await fetch(`${API_BASE}/api/materials/upload`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Upload failed');
      }
      setResult(data);
      onUploadSuccess();
    } catch (err: any) {
      setError(err.message || 'File upload failed');
    } finally {
      setUploading(false);
    }
  };

  const downloadSampleCSV = () => {
    const sample = `material_code,description,category,unit,annual_quantity,annual_spend\nCP-NEW-101,SS PIPE 2 INCH SCH 40 SMLS ASTM A312 TP304,Pipes,MTR,1200,1440000\nCP-NEW-102,BALL VALVE 2 INCH CLASS 150# FLANGED SS316,Valves,NOS,50,450000\nCP-NEW-103,DEEP GROOVE BALL BEARING 6205-2RS C3,Bearings,NOS,300,210000\n`;
    const blob = new Blob([sample], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'matisync_sample_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      <div className="flex items-center space-x-2">
        <button
          onClick={onBack}
          className="p-1.5 rounded hover:bg-slate-200 text-slate-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">Material Catalog Batch Ingestion</h1>
          <p className="text-xs text-slate-500">
            Import CSV master records with automated validation, quality scoring, and attribute extraction
          </p>
        </div>
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-md p-3 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-700 gap-2">
        <div className="flex items-center space-x-2">
          <Info className="w-4 h-4 text-brand-600 shrink-0" />
          <span>Upload CSV master records formatted according to CPSE Material Master Guidelines (columns: <code className="bg-slate-200 px-1 py-0.5 rounded text-[11px]">material_code</code>, <code className="bg-slate-200 px-1 py-0.5 rounded text-[11px]">description</code>, <code className="bg-slate-200 px-1 py-0.5 rounded text-[11px]">category</code>, <code className="bg-slate-200 px-1 py-0.5 rounded text-[11px]">unit</code>, <code className="bg-slate-200 px-1 py-0.5 rounded text-[11px]">annual_quantity</code>, <code className="bg-slate-200 px-1 py-0.5 rounded text-[11px]">annual_spend</code>).</span>
        </div>
        <button
          type="button"
          onClick={downloadSampleCSV}
          className="inline-flex items-center space-x-1.5 px-2.5 py-1 text-xs font-medium text-brand-700 hover:text-brand-900 hover:bg-brand-50 border border-brand-200 rounded transition-colors whitespace-nowrap self-start sm:self-auto"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Sample Template CSV</span>
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-xs space-y-6">
        <form onSubmit={handleUploadSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Target CPSE Organization
              </label>
              <select
                value={cpseCode}
                onChange={(e) => setCpseCode(e.target.value)}
                className="w-full border border-slate-300 rounded p-2 bg-white text-xs"
              >
                <option value="CPCL">CPCL — Chennai Petroleum Corporation Limited</option>
                <option value="NTPC">NTPC — NTPC Limited</option>
                <option value="ONGC">ONGC — Oil and Natural Gas Corporation</option>
                <option value="IOCL">IOCL — Indian Oil Corporation Limited</option>
                <option value="SAIL">SAIL — Steel Authority of India Limited</option>
                <option value="BPCL">BPCL — Bharat Petroleum Corporation Limited</option>
                <option value="BHEL">BHEL — Bharat Heavy Electricals Limited</option>
                <option value="CIL">CIL — Coal India Limited</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Sample File Template
              </label>
              <button
                type="button"
                onClick={downloadSampleCSV}
                className="w-full py-2 px-3 border border-slate-300 rounded bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium flex items-center justify-center space-x-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Sample CSV Template</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Select CSV Catalog File (.csv)
            </label>
            <div className="border-2 border-dashed border-slate-300 hover:border-brand-500 rounded-lg p-6 text-center bg-slate-50/50 cursor-pointer">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer space-y-2 block">
                <Upload className="w-8 h-8 text-slate-400 mx-auto" />
                <div className="font-semibold text-slate-700">
                  {selectedFile ? selectedFile.name : 'Click to select CSV catalog file'}
                </div>
                <div className="text-[11px] text-slate-500">
                  Required columns: <code className="font-mono bg-slate-200 px-1 py-0.5 rounded">material_code, description</code>
                </div>
              </label>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 text-rose-800 border border-rose-200 rounded text-xs">
              {error}
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onBack}
              className="px-4 py-2 border border-slate-300 rounded text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading || !selectedFile}
              className="px-5 py-2 bg-brand-900 text-white rounded font-medium hover:bg-brand-950 disabled:opacity-50 flex items-center space-x-1.5"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{uploading ? 'Validating & Ingesting...' : 'Validate and Import'}</span>
            </button>
          </div>
        </form>

        {/* Upload Results & Row-Level Validation Summary */}
        {result && (
          <div className="mt-6 border-t border-slate-200 pt-6 space-y-4">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <div>
                  <h4 className="font-bold text-emerald-950 text-xs">Batch Import Processed Successfully</h4>
                  <p className="text-xs text-emerald-800">
                    {result.valid_imported} valid material records ingested into {cpseCode} repository.
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-mono font-bold text-slate-600">
                  Total Processed: {result.total_rows_processed}
                </span>
              </div>
            </div>

            {/* Row-Level Errors Report */}
            {result.rejected_count > 0 && (
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-rose-700 font-bold text-xs">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Rejected Rows ({result.rejected_count}) — Not Discarded Silently</span>
                </div>
                <div className="border border-slate-200 rounded overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 text-[11px] uppercase">
                      <tr>
                        <th className="px-3 py-2">Row #</th>
                        <th className="px-3 py-2">Rejection Reason</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {result.rejected_rows.map((rej: any, idx: number) => (
                        <tr key={idx} className="bg-rose-50/30">
                          <td className="px-3 py-2 font-mono font-bold text-slate-800">{rej.row_number}</td>
                          <td className="px-3 py-2 text-rose-800">{rej.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
