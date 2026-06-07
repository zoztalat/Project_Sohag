import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Alert, AlertDescription } from './ui/alert';
import { ImageWithFallback } from './figma/ImageWithFallback';
import {
  Upload, Camera, Sparkles, AlertTriangle,
  CheckCircle, MapPin, Pill, Info, XCircle, Save,
} from 'lucide-react';
import { saveDiagnosis } from '../diagnosisHistory';

interface UploadDiagnosisProps {
  onNavigate: (page: string) => void;
}

interface DiagnosisResult {
  disease: string;
  confidence: number;
  severity: string;
  severe_case: boolean;
  standard_treatment: string;
  safe_alternative: string;
  conflict_detected: boolean;
  conflicting_drugs: string[];
}

const API_URL = 'http://localhost:8000';

const CHRONIC_MEDICATIONS = [
  'Insulin',
  'Oral Hypoglycemics (e.g., Metformin)',
  'Warfarin / Anticoagulants',
  'Methotrexate',
  'Amiodarone (QT-prolonging drug)',
  'Statins (e.g., Simvastatin, Atorvastatin)',
  'Calcium-Channel Blockers (e.g., Amlodipine)',
  'Beta-Blockers (e.g., Metoprolol)',
  'Probenecid',
  'Pregnancy',
];

function formatDiseaseName(name: string): string {
  return name
    .replace(/^(Ba|Fu|Pa|Vi)\s+/i, '')
    .replace(/\s+Photos?$/i, '')
    .replace(/\s+And\s+/gi, ' & ')
    .trim();
}

function severityColor(severity: string) {
  if (severity === 'Severe')   return 'bg-red-100 text-red-700';
  if (severity === 'Moderate') return 'bg-orange-100 text-orange-700';
  return 'bg-green-100 text-green-700';
}

export function UploadDiagnosis({ onNavigate }: UploadDiagnosisProps) {
  const [image, setImage]                     = useState<string | null>(null);
  const [imageFile, setImageFile]             = useState<File | null>(null);
  const [diagnosisResult, setDiagnosisResult] = useState<DiagnosisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing]         = useState(false);
  const [progress, setProgress]               = useState(0);
  const [chronicMeds, setChronicMeds]         = useState<string[]>([]);
  const [error, setError]                     = useState<string | null>(null);
  const [saved, setSaved]                     = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImage(reader.result as string);
    reader.readAsDataURL(file);
    setDiagnosisResult(null);
    setError(null);
    setSaved(false);
  };

  const toggleMedication = (med: string) =>
    setChronicMeds(prev => prev.includes(med) ? prev.filter(m => m !== med) : [...prev, med]);

  const handleAnalyze = async () => {
    if (!imageFile) return;
    setIsAnalyzing(true); setError(null); setSaved(false); setProgress(10);

    try {
      const formData = new FormData();
      formData.append('image', imageFile);
      formData.append('chronic_meds', JSON.stringify(chronicMeds));
      setProgress(40);

      const response = await fetch(`${API_URL}/diagnose`, { method: 'POST', body: formData });
      setProgress(80);
      if (!response.ok) throw new Error(`Server error: ${response.status}`);

      const data: DiagnosisResult = await response.json();
      setProgress(100);
      setDiagnosisResult(data);

      // ── Auto-save to Supabase ─────────────────────────────────────────
      await saveDiagnosis({
        date:               new Date().toISOString().split('T')[0],
        diagnosis:          formatDiseaseName(data.disease),
        confidence:         data.confidence,
        severity:           data.severity,
        medication:         data.conflict_detected ? data.safe_alternative : data.standard_treatment,
        conflict_detected:  data.conflict_detected,
        conflicting_drugs:  data.conflicting_drugs,
        safe_alternative:   data.safe_alternative,
        standard_treatment: data.standard_treatment,
        image_base64:       image || undefined,
        status:             'Ongoing',
      });
      setSaved(true);
    } catch (err: any) {
      setError(
        err.message?.includes('fetch')
          ? '⚠️ Cannot connect to AI server. Make sure api_server.py is running on port 8000.'
          : `Error: ${err.message}`
      );
    } finally {
      setIsAnalyzing(false); setProgress(0);
    }
  };

  return (
    <div className="max-w-6xl p-6 mx-auto space-y-6">
      <div>
        <h2 className="mb-2 dark:text-gray-100">AI Skin Diagnosis</h2>
        <p className="text-gray-500 dark:text-gray-400">Upload an image of the affected area for instant AI-powered analysis</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Upload */}
        <Card className="border-0 shadow-lg dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 dark:text-gray-100">
              <Camera className="w-5 h-5 text-blue-500" /> Upload Image
            </CardTitle>
            <CardDescription className="dark:text-gray-400">Take a clear photo of the affected skin area</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-8 text-center transition-colors border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-xl hover:border-blue-400 dark:hover:border-blue-500">
              {image ? (
                <div className="space-y-4">
                  <ImageWithFallback src={image} alt="Uploaded skin image" className="object-cover w-full h-64 rounded-lg" />
                  <Button variant="outline" onClick={() => { setImage(null); setImageFile(null); setDiagnosisResult(null); setSaved(false); }} className="w-full">
                    Remove Image
                  </Button>
                </div>
              ) : (
                <label htmlFor="image-upload" className="block cursor-pointer">
                  <div className="space-y-4">
                    <div className="flex items-center justify-center w-16 h-16 mx-auto bg-blue-100 dark:bg-blue-900/40 rounded-full">
                      <Upload className="w-8 h-8 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-300">Click to upload or drag and drop</p>
                      <p className="text-sm text-gray-400 dark:text-gray-500">PNG, JPG up to 10MB</p>
                    </div>
                  </div>
                  <input id="image-upload" type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </label>
              )}
            </div>

            <div className="space-y-3">
              <h4 className="flex items-center gap-2 dark:text-gray-200">
                <Pill className="w-4 h-4 text-blue-500" /> Chronic Medications (Select all that apply)
              </h4>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {CHRONIC_MEDICATIONS.map(med => (
                  <label key={med} className="flex items-center gap-2 p-2 text-sm rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 dark:text-gray-300">
                    <input type="checkbox" checked={chronicMeds.includes(med)} onChange={() => toggleMedication(med)} className="accent-blue-500" />
                    {med}
                  </label>
                ))}
              </div>
            </div>

            {error && (
              <Alert className="border-red-200 bg-red-50">
                <XCircle className="w-4 h-4 text-red-600" />
                <AlertDescription className="text-red-700 text-sm">{error}</AlertDescription>
              </Alert>
            )}

            <Button
              className="w-full h-12 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
              onClick={handleAnalyze} disabled={!image || isAnalyzing}
            >
              {isAnalyzing
                ? <><Sparkles className="w-5 h-5 mr-2 animate-spin" />Analyzing...</>
                : <><Sparkles className="w-5 h-5 mr-2" />Analyze with AI</>}
            </Button>
          </CardContent>
        </Card>

        {/* Result */}
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-gray-800 dark:to-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 dark:text-gray-100">
              <Sparkles className="w-5 h-5 text-cyan-500" /> Diagnosis Result
            </CardTitle>
            <CardDescription className="dark:text-gray-400">AI-powered skin analysis results</CardDescription>
          </CardHeader>
          <CardContent>
            {isAnalyzing ? (
              <div className="py-8 space-y-4">
                <div className="text-center">
                  <Sparkles className="w-12 h-12 mx-auto mb-4 text-blue-500 animate-pulse" />
                  <p className="text-gray-600 dark:text-gray-300">Analyzing your image with AI...</p>
                </div>
                <Progress value={progress} className="w-full" />
              </div>
            ) : diagnosisResult ? (
              <div className="space-y-4">
                {saved && (
                  <div className="flex items-center gap-2 text-green-600 dark:text-green-400 text-sm bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-lg px-3 py-2">
                    <Save className="w-4 h-4" /> Saved to your Medical History
                  </div>
                )}
                <div className="p-4 bg-white dark:bg-gray-800 rounded-xl">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="mb-1 dark:text-gray-100">{formatDiseaseName(diagnosisResult.disease)}</h3>
                      <Badge className={severityColor(diagnosisResult.severity)}>{diagnosisResult.severity}</Badge>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{diagnosisResult.confidence}%</div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Confidence</p>
                    </div>
                  </div>
                </div>

                {diagnosisResult.conflict_detected && (
                  <Alert className="border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    <AlertDescription>
                      <p className="font-semibold text-red-700 dark:text-red-400 mb-1">🚨 Drug Interaction Detected!</p>
                      <p className="text-sm text-red-600 dark:text-red-400">Conflict with: <strong>{diagnosisResult.conflicting_drugs.join(', ')}</strong></p>
                    </AlertDescription>
                  </Alert>
                )}

                <div className="p-4 bg-white dark:bg-gray-800 rounded-xl">
                  <h4 className="flex items-center gap-2 mb-3 dark:text-gray-200">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    {diagnosisResult.conflict_detected ? 'Recommended Treatment' : 'Standard Treatment'}
                  </h4>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                    {diagnosisResult.conflict_detected ? diagnosisResult.safe_alternative : diagnosisResult.standard_treatment}
                  </p>
                </div>

                {diagnosisResult.conflict_detected && (
                  <div className="p-4 bg-white dark:bg-gray-800 rounded-xl">
                    <h4 className="flex items-center gap-2 mb-2 dark:text-gray-200">
                      <Pill className="w-4 h-4 text-purple-500" /> Standard Treatment (Contraindicated)
                    </h4>
                    <p className="text-sm text-gray-400 dark:text-gray-500 line-through">{diagnosisResult.standard_treatment}</p>
                  </div>
                )}

                {diagnosisResult.severe_case ? (
                  <Alert className="border-red-200 dark:border-red-700 bg-red-50 dark:bg-red-900/20">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    <AlertDescription className="dark:text-red-400">This appears to be a severe case. We recommend consulting a dermatologist immediately.</AlertDescription>
                  </Alert>
                ) : (
                  <Alert className="border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20">
                    <Info className="w-4 h-4 text-blue-600" />
                    <AlertDescription className="dark:text-blue-400">This diagnosis is for informational purposes. Consult a healthcare professional for treatment.</AlertDescription>
                  </Alert>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" onClick={() => onNavigate('clinics')} className="w-full">
                    <MapPin className="w-4 h-4 mr-2" />Find Clinic
                  </Button>
                  <Button variant="outline" onClick={() => onNavigate('drugs')} className="w-full">
                    <Pill className="w-4 h-4 mr-2" />Check Drugs
                  </Button>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-gray-400 dark:text-gray-500">
                <Camera className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p>Upload an image and click "Analyze with AI" to see results</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
