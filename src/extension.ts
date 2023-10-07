import { ExtensionContext, window, commands } from 'vscode';
import { localRefresh, importBook, openBook, openDetail, chapterRefresh, editChapter, createChapter } from './commands';
import { BOOK_TREEVIEW_ID, CHAPTER_TREEVIEW_ID, Commands } from './config';
import { bookDataProvider, chapterDataProvider } from './explorer/treeDataProvider';

export function activate(context: ExtensionContext) {
  console.log('Congratulations, your extension "smart-writter" is now active!');

  context.subscriptions.push(
    bookDataProvider,
    chapterDataProvider,
    commands.registerCommand(Commands.localRefresh, localRefresh),
    commands.registerCommand(Commands.importBook, importBook),
    commands.registerCommand(Commands.openBook, openBook),
    commands.registerCommand(Commands.openDetail, openDetail(context)),
    commands.registerCommand(Commands.chapterRefresh, chapterRefresh),
    commands.registerCommand(Commands.editChapter, editChapter(context)),
    commands.registerCommand(Commands.createChapter, createChapter),
  );
  window.createTreeView(BOOK_TREEVIEW_ID, {
    treeDataProvider: bookDataProvider,
  });
  window.createTreeView(CHAPTER_TREEVIEW_ID, {
    treeDataProvider: chapterDataProvider,
  });
  commands.executeCommand(Commands.localRefresh);
}
export function deactivate() {}
