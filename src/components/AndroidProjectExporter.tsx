import React, { useState } from 'react';
import { ANDROID_PROJECT_FILES, AndroidProjectFile } from '../android_code/projectFiles';
import permanentAvatarDefault from '../assets/jarvis_avatar.jpg';
import JSZip from 'jszip';
import {
  Download,
  Copy,
  Check,
  FileCode,
  FolderTree,
  Code2,
  Terminal,
  Package,
  Smartphone,
  Info,
} from 'lucide-react';

export const AndroidProjectExporter: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<AndroidProjectFile>(ANDROID_PROJECT_FILES[0]);
  const [copied, setCopied] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState(false);
  const [copiedGitCmd, setCopiedGitCmd] = useState(false);
  const [isZipping, setIsZipping] = useState(false);

  const buildCommand = './gradlew assembleDebug';
  const gitPushCommands =
    'git init && git add . && git commit -m "JARVIS AI Android App" && git branch -M main && git remote add origin https://github.com/YOUR_USERNAME/jarvis-ai-android.git && git push -u origin main';

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyCommand = () => {
    navigator.clipboard.writeText(buildCommand);
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  const handleCopyGitCommands = () => {
    navigator.clipboard.writeText(gitPushCommands);
    setCopiedGitCmd(true);
    setTimeout(() => setCopiedGitCmd(false), 2000);
  };

  const handleDownloadZip = async () => {
    try {
      setIsZipping(true);
      const zip = new JSZip();

      // Project Root Readme
      zip.file(
        'README.md',
        `# JARVIS AI — Android Personal Voice Assistant

Built with **Kotlin** and **Jetpack Compose**.
Features:
- Permanent Cute 3D Anime Girl Avatar with Mood States & Audio-Frequency Breathing
- Sweet Indian Female Voice (Hindi 'hi-IN' & English 'en-IN')
- Bilingual Gemini AI Brain + Offline Smart Persona
- Universal Android App Launcher for 26+ Phone Apps (vivo V-Appstore, vivo Cloud, MyJio, MovieBox+, Maps, Meet, WhatsApp, YouTube, etc.)
- JarvisAccessibilityService for hands-free Global Navigation (Home, Back, Recents, Scroll, Click, Type)
- Foreground Voice Service with persistent microphone notification

## Option 1: Cloud Auto-APK via GitHub Actions
1. Extract this zip folder.
2. Create a new GitHub repository and push this folder to \`main\`.
3. Open your GitHub repository -> **Actions** tab -> click **Build JARVIS AI APK**.
4. Download the compiled **JARVIS-AI-debug-apk** (\`app-debug.apk\`) directly from Artifacts!

## Option 2: Build APK Directly in Android Studio
1. Extract this zip file.
2. Open Android Studio -> File -> Open... -> Select the extracted folder.
3. Wait for Gradle Sync to finish.
4. Click **Build -> Build Bundle(s) / APK(s) -> Build APK(s)**.
5. Your installable \`app-debug.apk\` will appear in \`app/build/outputs/apk/debug/app-debug.apk\`.
`
      );

      // gradle.properties
      zip.file(
        'gradle.properties',
        `org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8
android.useAndroidX=true
kotlin.code.style=official
android.nonTransitiveRClass=true
`
      );

      // gradle/libs.versions.toml
      zip.file(
        'gradle/libs.versions.toml',
        `[versions]
agp = "8.7.2"
kotlin = "2.0.21"
coreKtx = "1.13.1"
lifecycleRuntimeKtx = "2.8.6"
activityCompose = "1.9.3"
composeBom = "2024.10.00"

[libraries]
androidx-core-ktx = { group = "androidx.core", name = "core-ktx", version.ref = "coreKtx" }
androidx-lifecycle-runtime-ktx = { group = "androidx.lifecycle", name = "lifecycle-runtime-ktx", version.ref = "lifecycleRuntimeKtx" }
androidx-lifecycle-viewmodel-compose = { group = "androidx.lifecycle", name = "lifecycle-viewmodel-compose", version.ref = "lifecycleRuntimeKtx" }
androidx-activity-compose = { group = "androidx.activity", name = "activity-compose", version.ref = "activityCompose" }
androidx-compose-bom = { group = "androidx.compose", name = "compose-bom", version.ref = "composeBom" }
androidx-compose-ui = { group = "androidx.compose.ui", name = "ui" }
androidx-compose-ui-graphics = { group = "androidx.compose.ui", name = "ui-graphics" }
androidx-compose-material3 = { group = "androidx.compose.material3", name = "material3" }
androidx-compose-material-icons-extended = { group = "androidx.compose.material", name = "material-icons-extended" }

[plugins]
android-application = { id = "com.android.application", version.ref = "agp" }
kotlin-android = { id = "org.jetbrains.kotlin.android", version.ref = "kotlin" }
kotlin-compose = { id = "org.jetbrains.kotlin.plugin.compose", version.ref = "kotlin" }
`
      );

      // app/proguard-rules.pro
      zip.file(
        'app/proguard-rules.pro',
        `-keep class com.jarvis.ai.** { *; }
`
      );

      // Root Gradle settings
      zip.file(
        'settings.gradle.kts',
        `pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}
rootProject.name = "JarvisAI"
include(":app")
`
      );

      // Root build.gradle.kts
      zip.file(
        'build.gradle.kts',
        `plugins {
    alias(libs.plugins.android.application) apply false
    alias(libs.plugins.kotlin.android) apply false
    alias(libs.plugins.kotlin.compose) apply false
}
`
      );

      // Bulletproof GitHub Actions workflow to auto-compile downloadable APK
      zip.file(
        '.github/workflows/build-apk.yml',
        `name: Build JARVIS AI APK

on:
  push:
    branches: [ main, master ]
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Project
        uses: actions/checkout@v4

      - name: Set up JDK 17
        uses: actions/setup-java@v4
        with:
          java-version: '17'
          distribution: 'temurin'

      - name: Setup Android SDK
        uses: android-actions/setup-android@v3

      - name: Setup Gradle
        uses: gradle/actions/setup-gradle@v4
        with:
          gradle-version: '8.9'

      - name: Build Debug APK
        run: gradle assembleDebug --no-daemon

      - name: Upload APK Artifact
        uses: actions/upload-artifact@v4
        with:
          name: JARVIS-AI-debug-apk
          path: app/build/outputs/apk/debug/*.apk
`
      );

      // Embed permanent girl avatar drawable inside res/drawable
      try {
        const imgResp = await fetch(permanentAvatarDefault);
        if (imgResp.ok) {
          const imgBlob = await imgResp.blob();
          zip.file('app/src/main/res/drawable/jarvis_permanent_avatar.jpg', imgBlob);
        }
      } catch {
        // Non-blocking if asset fetch fails
      }

      // Add all project source files
      ANDROID_PROJECT_FILES.forEach((file) => {
        zip.file(file.path, file.content);
      });

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'JARVIS_AI_Android_APK_Project.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to generate project zip:', err);
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <div className="space-y-4 pb-6 text-slate-100">
      {/* Top Header Card */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-900/50 via-indigo-900/40 to-slate-900/50 border border-blue-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Code2 className="w-5 h-5 text-cyan-400" />
            <h3 className="font-bold text-sm text-white">
              Android Jetpack Compose Project & Cloud Auto-APK Builder
            </h3>
          </div>
          <p className="text-xs text-slate-300 mt-1">
            Complete self-contained Android project (`libs.versions.toml`, Kotlin, Compose, drawable, AccessibilityService, VoiceEngine) + GitHub Actions APK workflow.
          </p>
        </div>

        <button
          onClick={handleDownloadZip}
          disabled={isZipping}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition shrink-0 disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          <span>{isZipping ? 'Packing APK Project...' : 'Download Android Project (.ZIP)'}</span>
        </button>
      </div>

      {/* APK Build Guide Card */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-purple-500/30 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-purple-400" />
            <h4 className="text-xs font-bold text-purple-200 uppercase tracking-wider">
              Cloud Auto-APK (GitHub) & Local Build
            </h4>
          </div>
          <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-purple-500/20 border border-purple-400/40 text-purple-300 font-semibold">
            Android 8.0+ (API 26–35)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
            <span className="font-semibold text-cyan-300 flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5" />
              1. Android Studio (Direct APK)
            </span>
            <p className="text-[11px] text-slate-400">
              ZIP extract karke Android Studio me open karein aur{' '}
              <strong className="text-slate-200">Build → Build APK(s)</strong> par click karein.{' '}
              <code>app-debug.apk</code> turant ban jayegi.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
            <span className="font-semibold text-emerald-300 flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5" />
              2. Cloud Auto-APK (GitHub)
            </span>
            <p className="text-[11px] text-slate-400">
              Extracted folder me ye command chalayein — push hote hi GitHub Actions{' '}
              <strong className="text-slate-200">JARVIS-AI-debug-apk</strong> artifact build kar dega:
            </p>
            <div className="flex items-center justify-between gap-2 bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-800 font-mono text-[10px] text-emerald-300">
              <span className="truncate">{gitPushCommands}</span>
              <button
                onClick={handleCopyGitCommands}
                className="text-slate-400 hover:text-white shrink-0"
                title="Copy GitHub push commands"
              >
                {copiedGitCmd ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
            <span className="font-semibold text-amber-300 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5" />
              3. Terminal Command
            </span>
            <div className="flex items-center justify-between gap-2 bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-800 font-mono text-[11px] text-cyan-300">
              <span className="truncate">{buildCommand}</span>
              <button
                onClick={handleCopyCommand}
                className="text-slate-400 hover:text-white shrink-0"
                title="Copy build command"
              >
                {copiedCmd ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Explorer Split Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 h-[540px]">
        {/* Left: File Tree */}
        <div className="md:col-span-4 p-3 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col h-full overflow-hidden">
          <div className="flex items-center gap-2 pb-2 mb-2 border-b border-slate-800 text-xs font-semibold text-slate-400">
            <FolderTree className="w-4 h-4 text-cyan-400" />
            <span>Android Project Explorer ({ANDROID_PROJECT_FILES.length} Files)</span>
          </div>

          <div className="space-y-1 overflow-y-auto pr-1 flex-1">
            {ANDROID_PROJECT_FILES.map((file) => {
              const isSelected = selectedFile.path === file.path;
              return (
                <button
                  key={file.path}
                  onClick={() => setSelectedFile(file)}
                  className={`w-full text-left p-2 rounded-xl text-xs transition flex items-start gap-2.5 ${
                    isSelected
                      ? 'bg-cyan-500/20 border border-cyan-400/40 text-cyan-200'
                      : 'hover:bg-slate-800/60 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <FileCode
                    className={`w-4 h-4 shrink-0 mt-0.5 ${
                      isSelected ? 'text-cyan-400' : 'text-slate-500'
                    }`}
                  />
                  <div className="min-w-0">
                    <span className="font-medium block truncate text-slate-200">{file.name}</span>
                    <span className="text-[10px] text-slate-500 block truncate">{file.path}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Code Viewer */}
        <div className="md:col-span-8 p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col h-full overflow-hidden">
          {/* File Toolbar */}
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
            <div>
              <span className="text-xs font-bold text-white block">{selectedFile.name}</span>
              <p className="text-[11px] text-slate-400 mt-0.5">{selectedFile.description}</p>
            </div>
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 hover:text-white flex items-center gap-1.5 border border-slate-700 transition"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy Code'}</span>
            </button>
          </div>

          {/* Code Textarea */}
          <div className="flex-1 overflow-auto rounded-xl bg-slate-950 p-3.5 font-mono text-xs text-cyan-300/90 border border-slate-800/80 leading-relaxed selection:bg-cyan-500/30">
            <pre className="whitespace-pre">{selectedFile.content}</pre>
          </div>
        </div>
      </div>
    </div>
  );
};
