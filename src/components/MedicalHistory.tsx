import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ImageWithFallback } from './figma/ImageWithFallback';
import {
  History, Eye, Trash2, Download, Calendar,
  FileText, AlertTriangle, CheckCircle, Loader2,
} from 'lucide-react';
import {
  fetchDiagnosisHistory, deleteDiagnosis, updateDiagnosisStatus,
  type DiagnosisRecord,
} from '../diagnosisHistory';
import jsPDF from 'jspdf';

export function MedicalHistory() {
  const [records, setRecords]             = useState<DiagnosisRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<DiagnosisRecord | null>(null);
  const [loading, setLoading]             = useState(true);
  const [deletingId, setDeletingId]       = useState<string | null>(null);

  // ── Load records ────────────────────────────────────────────────────────────
  useEffect(() => {
    fetchDiagnosisHistory().then(data => {
      setRecords(data);
      setLoading(false);
    });
  }, []);

  // ── Delete ──────────────────────────────────────────────────────────────────
  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingId(id);
    await deleteDiagnosis(id);
    setRecords(prev => prev.filter(r => r.id !== id));
    if (selectedRecord?.id === id) setSelectedRecord(null);
    setDeletingId(null);
  };

  // ── Toggle status ───────────────────────────────────────────────────────────
  const handleToggleStatus = async (record: DiagnosisRecord, e: React.MouseEvent) => {
    e.stopPropagation();
    const newStatus = record.status === 'Ongoing' ? 'Resolved' : 'Ongoing';
    await updateDiagnosisStatus(record.id!, newStatus);
    setRecords(prev => prev.map(r => r.id === record.id ? { ...r, status: newStatus } : r));
    if (selectedRecord?.id === record.id) setSelectedRecord(prev => prev ? { ...prev, status: newStatus } : prev);
  };

  // ── Download PDF ────────────────────────────────────────────────────────────
  const handleDownloadPDF = (record: DiagnosisRecord) => {
    const doc = new jsPDF();
    const pageW = doc.internal.pageSize.getWidth();

    // Header bar
    doc.setFillColor(59, 130, 246); // blue-500
    doc.rect(0, 0, pageW, 28, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Skinova AI', 14, 12);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text('Medical Diagnosis Report', 14, 22);

    // Date on header right
    doc.setFontSize(9);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageW - 14, 22, { align: 'right' });

    let y = 40;
    doc.setTextColor(30, 30, 30);

    // ── Diagnosis info ──────────────────────────────────────────────────────
    doc.setFillColor(239, 246, 255); // blue-50
    doc.roundedRect(12, y - 6, pageW - 24, 52, 3, 3, 'F');

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 64, 175); // blue-800
    doc.text(record.diagnosis, 18, y + 4);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    doc.text(`Date: ${record.date}`, 18, y + 14);
    doc.text(`Confidence: ${record.confidence}%`, 18, y + 24);
    doc.text(`Severity: ${record.severity}`, 18, y + 34);
    doc.text(`Status: ${record.status}`, pageW / 2, y + 14);
    y += 60;

    // ── Treatment ───────────────────────────────────────────────────────────
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 30, 30);
    doc.text('Recommended Treatment', 14, y);
    y += 6;
    doc.setDrawColor(59, 130, 246);
    doc.setLineWidth(0.5);
    doc.line(14, y, pageW - 14, y);
    y += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    const txLines = doc.splitTextToSize(record.medication || 'N/A', pageW - 28);
    doc.text(txLines, 14, y);
    y += txLines.length * 6 + 10;

    // ── Drug Interaction ────────────────────────────────────────────────────
    if (record.conflict_detected) {
      doc.setFillColor(254, 242, 242); // red-50
      doc.roundedRect(12, y - 4, pageW - 24, 32, 3, 3, 'F');
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(185, 28, 28); // red-700
      doc.text('⚠  Drug Interaction Detected', 18, y + 6);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Conflicts: ${record.conflicting_drugs.join(', ')}`, 18, y + 16);
      doc.text(`Standard TX (avoided): ${record.standard_treatment}`, 18, y + 24);
      y += 42;
    }

    // ── Safe Alternative ────────────────────────────────────────────────────
    if (record.safe_alternative && record.safe_alternative !== 'None' && record.safe_alternative !== 'N/A') {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 30, 30);
      doc.text('Safe Alternative', 14, y);
      y += 6;
      doc.line(14, y, pageW - 14, y);
      y += 8;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(60, 60, 60);
      const altLines = doc.splitTextToSize(record.safe_alternative, pageW - 28);
      doc.text(altLines, 14, y);
      y += altLines.length * 6 + 10;
    }

    // ── Image (if stored) ───────────────────────────────────────────────────
    if (record.image_base64) {
      try {
        const remaining = doc.internal.pageSize.getHeight() - y - 20;
        const imgH = Math.min(70, remaining);
        if (imgH > 20) {
          doc.setFontSize(12);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(30, 30, 30);
          doc.text('Skin Image', 14, y);
          y += 8;
          doc.addImage(record.image_base64, 'JPEG', 14, y, 80, imgH);
          y += imgH + 10;
        }
      } catch (_) { /* skip if image fails */ }
    }

    // ── Footer ──────────────────────────────────────────────────────────────
    const pageH = doc.internal.pageSize.getHeight();
    doc.setFillColor(243, 244, 246);
    doc.rect(0, pageH - 16, pageW, 16, 'F');
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text('This report is for informational purposes only. Consult a healthcare professional for medical advice.', pageW / 2, pageH - 6, { align: 'center' });

    doc.save(`Skinova_Diagnosis_${record.diagnosis.replace(/\s+/g, '_')}_${record.date}.pdf`);
  };

  // ── Export all as PDF ───────────────────────────────────────────────────────
  const handleExportAll = () => {
    if (records.length === 0) return;
    const doc = new jsPDF();
    const pageW = doc.internal.pageSize.getWidth();

    doc.setFillColor(59, 130, 246);
    doc.rect(0, 0, pageW, 28, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Skinova AI — Medical History Report', 14, 18);

    let y = 40;

    records.forEach((record, i) => {
      if (y > 250) { doc.addPage(); y = 20; }

      doc.setFillColor(239, 246, 255);
      doc.roundedRect(12, y - 4, pageW - 24, 44, 3, 3, 'F');

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 64, 175);
      doc.text(`${i + 1}. ${record.diagnosis}`, 18, y + 6);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(80, 80, 80);
      doc.text(`Date: ${record.date}   |   Confidence: ${record.confidence}%   |   Severity: ${record.severity}   |   Status: ${record.status}`, 18, y + 16);

      const txLines = doc.splitTextToSize(`Treatment: ${record.medication}`, pageW - 36);
      doc.text(txLines, 18, y + 26);

      if (record.conflict_detected) {
        doc.setTextColor(185, 28, 28);
        doc.text(`⚠ Conflict: ${record.conflicting_drugs.join(', ')}`, 18, y + 34);
      }

      y += 54;
    });

    const pageH = doc.internal.pageSize.getHeight();
    doc.setFillColor(243, 244, 246);
    doc.rect(0, pageH - 16, pageW, 16, 'F');
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text('Skinova AI — For informational purposes only.', pageW / 2, pageH - 6, { align: 'center' });

    doc.save(`Skinova_Medical_History_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="mb-2 dark:text-gray-100">Medical History</h2>
          <p className="text-gray-500 dark:text-gray-400">View and manage your past diagnoses and treatments</p>
        </div>
        <Button
          onClick={handleExportAll}
          disabled={records.length === 0}
          className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
        >
          <Download className="w-4 h-4 mr-2" /> Export All Records
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Timeline */}
        <div className="lg:col-span-2">
          <Card className="border-0 shadow-lg dark:bg-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 dark:text-gray-100">
                <History className="w-5 h-5 text-blue-500" /> Diagnosis Timeline
              </CardTitle>
              <CardDescription className="dark:text-gray-400">Chronological view of your medical records</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-16 text-gray-400 dark:text-gray-500">
                  <Loader2 className="w-8 h-8 animate-spin mr-2" /> Loading records...
                </div>
              ) : records.length === 0 ? (
                <div className="text-center py-16 text-gray-400 dark:text-gray-500">
                  <History className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No diagnosis records yet.</p>
                  <p className="text-xs mt-1">Your records will appear here after your first AI diagnosis.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {records.map((record) => (
                    <div key={record.id} className="relative pl-8 pb-6 border-l-2 border-gray-200 dark:border-gray-600 last:border-l-0 last:pb-0">
                      <div className={`absolute left-0 top-0 -translate-x-1/2 w-4 h-4 rounded-full ring-4 ring-white dark:ring-gray-800 ${
                        record.conflict_detected
                          ? 'bg-gradient-to-br from-red-400 to-red-600'
                          : 'bg-gradient-to-br from-blue-500 to-cyan-500'
                      }`} />

                      <div
                        className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-gray-700 dark:to-gray-600 rounded-xl p-4 hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => setSelectedRecord(record)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="mb-1 flex items-center gap-2 dark:text-gray-100">
                              {record.diagnosis}
                              {record.conflict_detected && (
                                <span title="Drug interaction detected">
                                  <AlertTriangle className="w-4 h-4 text-red-500" />
                                </span>
                              )}
                            </h4>
                            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                              <Calendar className="w-4 h-4" /> {record.date}
                            </div>
                          </div>
                          <Badge
                            variant={record.status === 'Ongoing' ? 'default' : 'secondary'}
                            className="cursor-pointer"
                            onClick={(e) => handleToggleStatus(record, e)}
                            title="Click to toggle status"
                          >
                            {record.status}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                          <div>
                            <p className="text-gray-500 dark:text-gray-400">Severity</p>
                            <p className="text-gray-900 dark:text-gray-200">{record.severity}</p>
                          </div>
                          <div>
                            <p className="text-gray-500 dark:text-gray-400">Confidence</p>
                            <p className="text-gray-900 dark:text-gray-200">{record.confidence}%</p>
                          </div>
                          <div className="col-span-2">
                            <p className="text-gray-500 dark:text-gray-400">Medication</p>
                            <p className="text-gray-900 dark:text-gray-200 text-xs leading-relaxed">{record.medication}</p>
                          </div>
                        </div>

                        <div className="flex gap-2 mt-3">
                          <Button variant="outline" size="sm" className="flex-1 dark:border-gray-500 dark:text-gray-300 dark:hover:bg-gray-600" onClick={(e) => { e.stopPropagation(); setSelectedRecord(record); }}>
                            <Eye className="w-3 h-3 mr-1" /> View
                          </Button>
                          <Button variant="outline" size="sm" className="dark:border-gray-500 dark:text-gray-300 dark:hover:bg-gray-600" onClick={(e) => { e.stopPropagation(); handleDownloadPDF(record); }}>
                            <Download className="w-3 h-3 mr-1" /> PDF
                          </Button>
                          <Button
                            variant="outline" size="sm"
                            className="dark:border-gray-500 dark:text-gray-300 dark:hover:bg-gray-600"
                            onClick={(e) => handleDelete(record.id!, e)}
                            disabled={deletingId === record.id}
                          >
                            {deletingId === record.id
                              ? <Loader2 className="w-3 h-3 animate-spin" />
                              : <Trash2 className="w-3 h-3" />}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Detail */}
        <div>
          <Card className="border-0 shadow-lg sticky top-6 dark:bg-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 dark:text-gray-100">
                <FileText className="w-5 h-5 text-purple-500" /> Record Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedRecord ? (
                <div className="space-y-4">
                  {selectedRecord.image_base64 ? (
                    <img src={selectedRecord.image_base64} alt="Diagnosis" className="w-full h-48 object-cover rounded-lg" />
                  ) : (
                    <div className="w-full h-32 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center text-gray-400">
                      <FileText className="w-10 h-10 opacity-30" />
                    </div>
                  )}

                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Diagnosis</p>
                      <p className="font-medium dark:text-gray-100">{selectedRecord.diagnosis}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Date</p>
                      <p className="dark:text-gray-200">{selectedRecord.date}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Severity</p>
                        <Badge variant="secondary">{selectedRecord.severity}</Badge>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Confidence</p>
                        <p className="dark:text-gray-200">{selectedRecord.confidence}%</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Medication</p>
                      <p className="text-sm leading-relaxed dark:text-gray-300">{selectedRecord.medication}</p>
                    </div>

                    {selectedRecord.conflict_detected && (
                      <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-700">
                        <p className="text-xs font-semibold text-red-700 dark:text-red-400 flex items-center gap-1 mb-1">
                          <AlertTriangle className="w-3 h-3" /> Drug Interaction
                        </p>
                        <p className="text-xs text-red-600 dark:text-red-400">{selectedRecord.conflicting_drugs.join(', ')}</p>
                      </div>
                    )}

                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                      <Badge
                        variant={selectedRecord.status === 'Ongoing' ? 'default' : 'secondary'}
                        className="cursor-pointer"
                        onClick={(e) => handleToggleStatus(selectedRecord, e)}
                        title="Click to toggle"
                      >
                        {selectedRecord.status}
                      </Badge>
                    </div>
                  </div>

                  <Button className="w-full bg-gradient-to-r from-blue-500 to-cyan-500" onClick={() => handleDownloadPDF(selectedRecord)}>
                    <Download className="w-4 h-4 mr-2" /> Download PDF Report
                  </Button>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-400 dark:text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Select a record to view details</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
