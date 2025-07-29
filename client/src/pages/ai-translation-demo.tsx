import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Languages, Sparkles, Check, AlertCircle } from "lucide-react";
import { AITranslate, AITranslateHeading, AITranslateParagraph } from "@/components/ai-translate";
import { useAITranslation } from "@/hooks/useAITranslation";
import Navigation from "@/components/navigation";
import LanguageSwitcher from "@/components/language-switcher";

export default function AITranslationDemo() {
  const { t, i18n } = useTranslation();
  const [customText, setCustomText] = useState("Welcome to Byootify - your beauty marketplace!");
  const [isTranslating, setIsTranslating] = useState(false);
  
  const translatedCustomText = useAITranslation(customText);

  const demoTexts = [
    "Book your appointment today",
    "Professional beauty services",
    "Trusted providers in your area",
    "Transform your look with confidence",
    "Quality service guaranteed"
  ];

  const testTranslation = async () => {
    if (!customText.trim()) return;
    
    setIsTranslating(true);
    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: customText,
          targetLanguage: i18n.language
        })
      });
      
      const data = await response.json();
      console.log('Translation result:', data);
    } catch (error) {
      console.error('Translation test failed:', error);
    } finally {
      setIsTranslating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Languages className="h-8 w-8 text-primary" />
            <Sparkles className="h-6 w-6 text-secondary" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            AI Translation System Demo
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Experience real-time AI-powered translation across multiple languages. 
            Switch languages using the selector below to see content translate automatically.
          </p>
        </div>

        {/* Language Switcher */}
        <div className="flex justify-center mb-8">
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-700">Language:</span>
              <LanguageSwitcher />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Live Translation Examples */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-500" />
                Live Translation Examples
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Header Examples:</h3>
                <div className="space-y-3">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <AITranslateHeading as="h4" className="text-lg font-semibold text-gray-900">
                      Featured Beauty Providers
                    </AITranslateHeading>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <AITranslateHeading as="h4" className="text-lg font-semibold text-gray-900">
                      Explore Beauty Services
                    </AITranslateHeading>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Description Examples:</h3>
                <div className="space-y-3">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <AITranslateParagraph className="text-gray-700">
                      Discover top-rated providers in your area, verified and ready to transform your look.
                    </AITranslateParagraph>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <AITranslateParagraph className="text-gray-700">
                      Professional beauty services delivered to your location with convenience and quality.
                    </AITranslateParagraph>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Action Text Examples:</h3>
                <div className="grid grid-cols-2 gap-3">
                  {demoTexts.map((text, index) => (
                    <Badge key={index} variant="outline" className="p-2 justify-center">
                      <AITranslate>{text}</AITranslate>
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Custom Translation Tester */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Custom Translation Tester
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enter text to translate:
                </label>
                <Textarea
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  placeholder="Type any text to see it translated in real-time..."
                  className="min-h-[100px]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  AI Translation Result:
                </label>
                <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
                  <p className="text-blue-900 font-medium">
                    {translatedCustomText}
                  </p>
                </div>
              </div>

              <Button 
                onClick={testTranslation}
                disabled={isTranslating || !customText.trim()}
                className="w-full"
              >
                {isTranslating ? "Translating..." : "Test API Translation"}
              </Button>

              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="text-sm text-yellow-800 font-medium">Note:</p>
                    <p className="text-sm text-yellow-700">
                      AI translation uses OpenAI's API. Rate limits may apply. 
                      Fallback to original text occurs if translation fails.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* System Information */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>AI Translation System Features</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Check className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="font-semibold mb-2">Real-time Translation</h3>
                <p className="text-sm text-gray-600">
                  Content translates automatically when language changes
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Languages className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-semibold mb-2">Multi-language Support</h3>
                <p className="text-sm text-gray-600">
                  Spanish, French, Chinese, Arabic, and more
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Sparkles className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="font-semibold mb-2">AI-Powered Quality</h3>
                <p className="text-sm text-gray-600">
                  Context-aware translations using OpenAI
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}