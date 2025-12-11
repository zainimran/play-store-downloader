'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Download, Globe, Server, Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function Home() {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [useProxy, setUseProxy] = useState(true);

  const handleDownload = async () => {
    if (!input) {
      toast.error('Please enter an App ID or URL');
      return;
    }

    setIsLoading(true);
    let targetUrl = input;

    // Simple heuristic to check if input is an App ID
    if (!input.startsWith('http')) {
      // Assume it's an App ID if it doesn't start with http
      // e.g. com.google.android.youtube
      targetUrl = `https://play.google.com/store/apps/details?id=${input.trim()}`;
    }

    // Extract App ID for filename
    let appId = 'play-store-page';
    try {
      const urlObj = new URL(targetUrl);
      const idParam = urlObj.searchParams.get('id');
      if (idParam) appId = idParam;
    } catch (e) {
      // If URL parsing fails, just use default name
    }

    try {
      let htmlContent = '';

      if (useProxy) {
        // Server-side Proxy Mode
        const response = await fetch(`/api/proxy?url=${encodeURIComponent(targetUrl)}`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch via proxy');
        }
        htmlContent = await response.text();
      } else {
        // Client-side Fetch Mode
        try {
          const response = await fetch(targetUrl);
          if (!response.ok) {
            throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
          }
          htmlContent = await response.text();
          
          // Inject base tag for client-side fetch as well
          if (!htmlContent.includes('<base')) {
             const baseUrl = new URL(targetUrl).origin;
             htmlContent = htmlContent.replace('<head>', `<head><base href="${baseUrl}">`);
          }

        } catch (error: any) {
          console.error("Client fetch error:", error);
          throw new Error(
            'Client-side fetch failed. This is likely due to CORS restrictions by Google. ' +
            'Please enable "Use Local Proxy" or use a browser extension to disable CORS.'
          );
        }
      }

      // Trigger Download
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `${appId}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);

      toast.success('Download started!');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-xl">
        <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-t-xl">
          <CardTitle className="text-2xl flex items-center gap-2">
            <Download className="h-6 w-6" />
            Play Store Downloader
          </CardTitle>
          <CardDescription className="text-green-100">
            Download Google Play Store pages as single HTML files.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          
          <div className="space-y-2">
            <Label htmlFor="app-input" className="text-base font-medium">
              App ID or URL
            </Label>
            <Input
              id="app-input"
              placeholder="e.g. com.google.android.youtube or https://play.google.com/..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="h-12 text-lg"
            />
            <p className="text-sm text-slate-500">
              Enter the package name (App ID) or the full Play Store URL.
            </p>
          </div>

          <div className="flex items-center justify-between bg-slate-100 p-4 rounded-lg border border-slate-200">
            <div className="space-y-0.5">
              <Label className="text-base flex items-center gap-2 text-slate-900">
                {useProxy ? <Server className="h-4 w-4 text-blue-600" /> : <Globe className="h-4 w-4 text-green-600" />}
                {useProxy ? 'Use Local Proxy' : 'Client-side Fetch'}
              </Label>
              <p className="text-sm text-slate-600">
                {useProxy 
                  ? 'Uses the local server to fetch the page (bypasses CORS).' 
                  : 'Fetches directly from your browser (requires CORS disabled).'}
              </p>
            </div>
            <Switch
              checked={useProxy}
              onCheckedChange={setUseProxy}
            />
          </div>

          {!useProxy && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Warning</AlertTitle>
              <AlertDescription>
                Direct client-side fetching will likely fail due to CORS restrictions unless you have a browser extension enabled to bypass them.
              </AlertDescription>
            </Alert>
          )}

          <Button 
            onClick={handleDownload} 
            disabled={isLoading} 
            className="w-full h-12 text-lg bg-green-600 hover:bg-green-700 transition-all"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Fetching...
              </>
            ) : (
              <>
                <Download className="mr-2 h-5 w-5" />
                Download HTML
              </>
            )}
          </Button>

        </CardContent>
      </Card>
    </div>
  );
}
